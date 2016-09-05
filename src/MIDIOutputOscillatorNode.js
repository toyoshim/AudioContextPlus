(function (global) {
'use strict';

/* global ADSREnvelopeNode */
/* global AudioContext */
/* global Event */
/* global MIDIOutputAudioNodeHelper */

// A special symbol to hide private members.
const _private = Symbol();

// A private class to manage note controls.
class MonophonicNoteController {
  // @param {Function} noteOn callback to handle note on
  // @param {Function} noteChange callback to handle note change
  // @param {Function} noteOff callback to handle note off
  // @constructor
  constructor(noteOn, noteChange, noteOff) {
    this.noteOn = noteOn;
    this.noteChange = noteChange;
    this.noteOff = noteOff;
    this.notes = [];
    this.velocities = {};
  }

  // Handles note off message
  // @param {number} note note number
  // @param {number} velocity off velocity
  handleNoteOff(note, velocity) {
    const i = this.notes.indexOf(note);
    if (i >= 0) {
      this.notes.splice(i, 1);
      delete this.velocities[note];
    }
    if (this.notes.length === 0) {
      this.noteOff();
    }
    else {
      const newNote = this.notes[this.notes.length - 1];
      this.noteChange(newNote, this.velocities[newNote]);
    }
  }

  // Handles note on message
  // @param {number} note note number
  // @param {number} velocity velocity
  handleNoteOn(note, velocity) {
    this.notes.push(note);
    this.velocities[note] = velocity;
    this.noteOn(note, velocity);
  }
}

class MIDIOutputOscillatorNode extends MIDIOutputAudioNodeHelper {
  // @param {AudioContext} [context] AudioContext
  // @constructor
  constructor(context) {
    super(context);
    this[_private] = {
      context: context || new AudioContext,
      oscillator: null,
      envelope: null,
      lfo: null,
      lfoGain: null,
      types: [
        'sine',
        'square',
        'sawtooth',
        'triangle'
      ],
      note: 69,
      bend: 0,
      noteController: null
    };
    const _ = this[_private];
    _.oscillator = _.context.createOscillator();
    _.oscillator.type = 'sine';
    _.oscillator.frequency.value = 440;
    _.oscillator.start();
    _.envelope = new ADSREnvelopeNode(_.context);
    _.lfo = _.context.createOscillator();
    _.lfo.type = 'sine';
    _.lfo.frequency.value = 6;
    _.lfo.start();
    _.lfoGain = _.context.createGain();
    _.lfoGain.gain.value = 0;
    _.oscillator.connect(_.envelope.node);
    _.lfo.connect(_.lfoGain);
    _.lfoGain.connect(_.oscillator.detune);

    const noteOn = (note, velocity) => {
      _.note = note;
      _.oscillator.frequency.setValueAtTime(
        this.getFrequencyForNote(_.note, _.bend), 0);
      _.envelope.on(velocity / 127);
    };
    const noteOff = (note, velocity) => {
      _.envelope.off();
    };
    _.noteController =
      new MonophonicNoteController(noteOn, noteOn, noteOff);
  }

  // @return {AudioNode} node to be connected.
  get node() { return this[_private].envelope; }

  // @return {String} manufacturer
  get manufacturer() { return 'toyoshim@gmail.com'; }

  // @return {String} name
  get name() { return 'MIDIOutputOscillatorNode'; }

  // @return {String} version
  get version() { return '1.00'; }

  // @return {Array<Program>} program list
  get programs() {
    return [{
      name: 'Sine',
      controls: []
    }, {
      name: 'Square',
      controls: []
    }, {
      name: 'Sawtooth',
      controls: []
    }, {
      name: 'Triangle',
      controls: []
    }];
  }

  // @return {Array<Control>} control list
  get controls() {
    const e = this[_private].envelope;
    return [{
      name: 'A',
      value: e.a * 127,
      min: 0,
      max: 127,
      default: 0,
      cc: [73]
    }, {
      name: 'D',
      value: e.d * 127,
      min: 0,
      max: 127,
      default: 0,
      cc: [72]
    }, {
      name: 'S',
      value: e.s * 127,
      min: 0,
      max: 127,
      default: 127,
      cc: [74]
    }, {
      name: 'R',
      value: e.r * 127,
      min: 0,
      max: 127,
      default: 0,
      cc: [71]
    }, ];
  }

  // Handles Note Off event.
  // @param {number} ch channel
  // @param {number} note note number
  // @param {number} velocity off velocity
  handleNoteOff(ch, note, velocity) {
    if (ch != 0)
      return;
    this[_private].noteController.handleNoteOff(note, velocity);
  }

  // Handles Note On event.
  // @param {number} ch channel
  // @param {number} note note number
  // @param {number} velocity velocity
  handleNoteOn(ch, note, velocity) {
    if (ch != 0)
      return;
    this[_private].noteController.handleNoteOn(note, velocity);
  }

  // Handles Key Pressure event.
  // @param {number} ch channel
  // @param {number} note note number
  // @param {number} pressure key pressure
  handleKeyPressure(ch, note, pressure) {}

  // Handles Control Change event.
  // @param {number} ch channel
  // @param {number} number control number
  // @param {number} value control value
  handleControlChange(ch, number, value) {
    if (ch != 0)
      return;
    const _ = this[_private];
    let name;
    switch (number) {
      case 1: // Modulation (TODO: Probably this should be exposed too.)
        _.lfoGain.gain.value = value;
        return;
      case 73: // A
        _.envelope.a = value / 127;
        name = 'A';
        break;
      case 72: // D
        _.envelope.d = value / 127;
        name = 'D';
        break;
      case 74: // S
        _.envelope.s = value / 127;
        name = 'S';
        break;
      case 71: // R
        _.envelope.r = value / 127;
        name = 'R';
        break;
    }
    const event = new Event('controlchange');
    event.control = {
      name: name,
      value: value
    };
    this.dispatchEvent(event);
  }

  // Handles Program Change event.
  // @param {number} ch channel
  // @param {number} program program number
  handleProgramChange(ch, program) {
    if (ch != 0)
      return;
    const _ = this[_private];
    if (program > _.types.length)
      return;
    _.oscillator.type = _.types[program];
    _.envelope.a = this.controls[0].default / 127;
    _.envelope.d = this.controls[1].default / 127;
    _.envelope.s = this.controls[2].default / 127;
    _.envelope.r = this.controls[3].default / 127;
  }

  // Handles Channel Pressure event.
  // @param {number} ch channel
  // @param {number} pressure channel pressure
  handleChannelPressure(ch, pressure) {}

  // Handles Pitch Bend Change event.
  // @param {number} ch channel
  // @param {number} value pitch bend value
  handlePitchBendChange(ch, value) {
    if (ch != 0)
      return;
    const _ = this[_private];
    _.bend = value * 3;
    _.oscillator.frequency.setValueAtTime(
      this.getFrequencyForNote(_.note, _.bend), 0);
  }

  // Handles System Exclusive event.
  // @param {sequence<octet>} message system exclusive message
  handleSystemExclusive(message) {}

  // Handles Reset event.
  handleReset() {}
}

global.MIDIOutputOscillatorNode = MIDIOutputOscillatorNode;

})(typeof global !== 'undefined' ? global : window);