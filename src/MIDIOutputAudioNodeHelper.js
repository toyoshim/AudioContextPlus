(function (global) {
'use strict';

/* global MIDIOutputAudioNode */

// A special symbol to hide private members.
const _private = Symbol();

class MIDIOutputAudioNodeHelper extends MIDIOutputAudioNode {
  // @param {AudioContext} [context] AudioContext
  // @constructor
  constructor(context) {
    super(context);
    this[_private] = {
      sendErrorHeader: 'Failed to execute \'send\' on \'' +
        this.constructor.name + '\': ',
      dataCheck: (index, data1, data2) => {
        let data = data1;
        if (data1 < 0x80) {
          if (data2 === undefined || data2 < 0x80)
            return;
          index++;
          data = data2;
        }
        throw TypeError(this[_private].sendErrorHeader +
          'Unexpected status byte at index ' + index +
          ' (' + data + ').');
      }
    };
  }

  // @return {String} name
  get name() {
    return 'MIDIOutputAudioNodeHelper';
  }

  // @return {String} version
  get version() {
    return '0.91';
  }

  // Sends MIDI messages to this node's input.
  // @param {sequence<octet>} data MIDI messages
  send(data) {
    super.send(data);
    const _ = this[_private];
    for (let i = 0; i < data.length; ++i) {
      const status = data[i] >> 4;
      const ch = data[i] & 0x0f;
      if (status < 8) {
        throw new TypeError(_.sendErrorHeader +
          'Running status is not allowed at index ' +
          i + ' (' + data[i] + ').');
      }
      switch (status) {
        case 0x8:
          if (i + 2 >= data.length)
            break;
          _.dataCheck(i + 1, data[i + 1], data[i + 2]);
          this.handleNoteOff(ch, data[i + 1], data[i + 2]);
          i += 2;
          continue;
        case 0x9:
          if (i + 2 >= data.length)
            break;
          _.dataCheck(i + 1, data[i + 1], data[i + 2]);
          if (data[i + 2] === 0)
            this.handleNoteOff(ch, data[i + 1], data[i + 2]);
          else
            this.handleNoteOn(ch, data[i + 1], data[i + 2]);
          i += 2;
          continue;
        case 0xa:
          if (i + 2 >= data.length)
            break;
          _.dataCheck(i + 1, data[i + 1], data[i + 2]);
          this.handleKeyPressure(ch, data[i + 1], data[i + 2]);
          i += 2;
          continue;
        case 0xb:
          if (i + 2 >= data.length)
            break;
          _.dataCheck(i + 1, data[i + 1], data[i + 2]);
          this.handleControlChange(ch, data[i + 1], data[i + 2]);
          i += 2;
          continue;
        case 0xc:
          if (i + 1 >= data.length)
            break;
          _.dataCheck(i + 1, data[i + 1]);
          this.handleProgramChange(ch, data[i + 1]);
          i += 1;
          continue;
        case 0xd:
          if (i + 1 >= data.length)
            break;
          _.dataCheck(i + 1, data[i + 1]);
          this.handleChannelPressure(ch, data[i + 1]);
          i += 1;
          continue;
        case 0xe:
          if (i + 2 >= data.length)
            break;
          _.dataCheck(i + 1, data[i + 1], data[i + 2]);
          this.handlePitchBendChange(
            ch, (data[i + 2] << 7) + data[i + 1] - 8192);
          i += 2;
          continue;
      }
      switch (data[i]) {
        case 0xf0:
          for (let length = 1; length <= data.length - i; ++length) {
            if (data[i + length] == 0xf7) {
              this.handleSystemExclusive(
                data.slice(i + 1, i + length));
              i += length;
              break;
            }
            if (data[i + length] >= 0x80) {
              throw new TypeError(
                _.sendErrorHeader +
                'System exclusive message contains a ' +
                'status byte at index ' + (i + length) +
                ' (' + data[i + length] + ').');
            }
          }
          if (data[i] == 0xf7)
            continue;
          throw new TypeError(
            _.sendErrorHeader +
            'System exclusive message is not ended by ' +
            'end of system exclusive message.');
        case 0xf1:
          this.handleTimeCodeQuarterFrame();
          continue;
        case 0xf2:
          if (i + 1 >= data.length)
            break;
          _.dataCheck(i + 1, data[i + 1]);
          this.handleSongPositionPointer(data[i + 1]);
          i += 1;
          continue;
        case 0xf3:
          if (i + 1 >= data.length)
            break;
          _.dataCheck(i + 1, data[i + 1]);
          this.handleSongSelect(data[i + 1]);
          i += 1;
          continue;
        case 0xf6:
          this.handleTuneRequest();
          continue;
        case 0xf7:
          throw new TypeError(
            _.sendErrorHeader +
            'Unexpected end of system exclusive message at ' +
            'index ' + i + ' (' + data[i] + ').');
        case 0xf8:
          this.handleTimingClock();
          continue;
        case 0xfa:
          this.handleStart();
          continue;
        case 0xfb:
          this.handleContinue();
          continue;
        case 0xfc:
          this.handleStop();
          continue;
        case 0xfe:
          this.handleActiveSensing();
          continue;
        case 0xff:
          this.handleReset();
          continue;
        case 0xf4:
        case 0xf5:
        case 0xf9:
        case 0xfd:
          throw new TypeError(
            _.sendErrorHeader +
            'Reserved status is not allowed at index ' + i +
            ' (' + data[i] + ').');
      }
      throw new TypeError(_.sendErrorHeader + 'Message is incomplete.');
    }
  }

  // Calculates frequency for note with detune.
  // @param {number} note note number (A4 is 69)
  // @param {number} detune (note/2048)
  getFrequencyForNote(note, detune) {
    return 440 * Math.pow(2, (note - 69 + detune / 2048) / 12);
  }

  // Handles Note Off event.
  // @param {number} ch channel
  // @param {number} note note number
  // @param {number} velocity off velocity
  handleNoteOff(ch, note, velocity) {}

  // Handles Note On event.
  // @param {number} ch channel
  // @param {number} note note number
  // @param {number} velocity velocity
  handleNoteOn(ch, note, velocity) {}

  // Handles Key Pressure event.
  // @param {number} ch channel
  // @param {number} note note number
  // @param {number} pressure key pressure
  handleKeyPressure(ch, note, pressure) {}

  // Handles Control Change event.
  // @param {number} ch channel
  // @param {number} number control number
  // @param {number} value control value
  handleControlChange(ch, number, value) {}

  // Handles Program Change event.
  // @param {number} ch channel
  // @param {number} program program number
  handleProgramChange(ch, program) {}

  // Handles Channel Pressure event.
  // @param {number} ch channel
  // @param {number} pressure channel pressure
  handleChannelPressure(ch, pressure) {}

  // Handles Pitch Bend Change event.
  // @param {number} ch channel
  // @param {number} value pitch bend value
  handlePitchBendChange(ch, value) {}

  // Handles System Exclusive event.
  // @param {sequence<octet>} message system exclusive message
  handleSystemExclusive(message) {}

  // Handles Time Code Quarter Frame event.
  handleTimeCodeQuarterFrame() {}

  // Handles Song Position Pointer event.
  // @param {number} position song position pointer
  handleSongPositionPointer(position) {}

  // Handles Song Select event.
  // @param {number} song song select
  handleSongSelect(song) {}

  // Handles Tune Request event.
  handleTuneRequest() {}

  // Handles Timing Clock event.
  handleTimingClock() {}

  // Handles Start event.
  handleStart() {}

  // Handles Continue event.
  handleContinue() {}

  // Handles Stop event.
  handleStop() {}

  // Handles Active Sensing event.
  handleActiveSensing() {}

  // Handles Reset event.
  handleReset() {}
}

global.MIDIOutputAudioNodeHelper = MIDIOutputAudioNodeHelper;

})(typeof global !== 'undefined' ? global : window);