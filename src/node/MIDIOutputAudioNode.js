(function (global) {
'use strict';

/* global AudioContext */
/* global AudioNodePlus */
/* global Event */
/* global btoa */

// A special symbol to hide private members.
const _private = Symbol();

class MIDIOutputAudioNode extends AudioNodePlus {
  // @param {AudioContext} [context] AudioContext
  // @constructor
  constructor(context) {
    super();
    this[_private] = {
      context: context || new AudioContext,
      state: 'closed',
      stateChangeListeners: [],
      controlChangeListeners: [],
      changeState: (state) => {
        if (this[_private].state == state)
          return;
        this[_private].state = state;
        const event = new Event('statechange');
        event.port = this;
        this.dispatchEvent(event);
      }
    };

    this.onstatechange = null;
    this.oncontrolchange = null;
  }

  // @return {Array<Program>} program list
  // Program: {
  //   name: {String} program name
  //   values: {Array<ControlValue>} control value list
  // }
  // ControlValue: {
  //   name: {String} control name
  //   value: {number} control value
  // }
  get programs() {
    return []
  };

  // @return {Array<Control>} control list
  // Control: {
  //   name: {String} control name
  //   value: {number} current value
  //   min: {number} minimum value
  //   max: {number} maximum value
  //   default: {number} default value
  //   [cc]: {Array<number>} control change number to overwrite temporarily
  //   [sysex]: {sequence<octet>} sysex prefix sequence to modify program
  // }
  // |value| could be in one of Uint7, Int7, Uint14, and Int14.
  // If |value| is in Uint7 and Int7, |cc|'s length should be 1, otherwise 2.
  // Control change number should be in order of MSB, LSB.
  // Examples)
  //   cc: [16], sysex: [0x7d, 16]
  //     MIDI message to overwrite current value: [0xb?, 16, value]
  //     MIDI message to modify program: [0xf0, 0x7d, 16, value, 0xf7]
  //   cc: [16, 45], sysex: [0x7d, 16] (MSB = value >> 7, LSB = value & 0x7f)
  //     MIDI messages to overwrite current value: [0xb?, 16, MSB, 45, LSB]
  //     MIDI message to modify program: [0xf0, 0x7d, 16, MSB, LSB, 0xf7]
  get controls() {
    return []
  };

  //---- EventTarget interfaces ----

  // Adds an event listener.
  // @param {String} type event type
  // @param {EventListener} listener event listener
  // @param {boolean} [useCapture] a flag to indiate initiating capture.
  addEventListener(type, listener, useCapture) {
    if (type == 'statechange') {
      this[_private].stateChangeListeners.push(listener);
    }
    else if (type == 'controlchange') {
      this[_private].controlChangeListeners.push(listener);
    }
  }

  // Removes an event listener.
  // @param {String} type event type
  // @param {EventListener} listener event listener
  // @param {boolean} [useCapture] a flag to indiate initiating capture.
  removeEventListener(type, listener, useCapture) {
    if (type == 'statechange') {
      const index = this[_private].stateChangeListeners.indexOf(listener);
      if (index >= 0)
        this[_private].stateChangeListeners.splice(index);
    }
    else if (type == 'controlchange') {
      const index =
        this[_private].controlChangeListeners.indexOf(listener);
      if (index >= 0)
        this[_private].controlChangeListeners.splice(index);
    }
  }

  // Dispatches an event.
  // @param {Event} e event to dispatch
  dispatchEvent(e) {
    if (e.type == "statechange") {
      this[_private].stateChangeListeners.forEach(listener => {
        listener(e);
      });
      if (this.onstatechange)
        this.onstatechange(e);
    }
    else if (e.type == "controlchange") {
      if (!e.target)
        e.port = this;
      this[_private].controlChangeListeners.forEach(listener => {
        listener(e);
      });
      if (this.oncontrolchange)
        this.oncontrolchange(e);
    }
    return e.defaultPrevented || true;
  }

  //---- MIDIPort interfaces ----

  // Opens port.
  // @return {Promise}
  open() {
    return new Promise((resolve, reject) => {
      this[_private].changeState('open');
      resolve(this);
    });
  }

  // Closes port.
  // @return {Promise}
  close() {
    return new Promise((resolve, reject) => {
      this[_private].changeState('closed');
      resolve(this);
    });
  }

  // @return {String} id
  get id() {
    return btoa(this.name());
  }

  // @return {String} manufacturer
  get manufacturer() {
    return 'toyoshim@gmail.com';
  }

  // @return {String} name
  get name() {
    return 'MIDIOutputAudioNode';
  }

  // @return {MIDIPortType} type
  get type() {
    return 'output';
  }

  // @return {String} version
  get version() {
    return '0.91';
  }

  // @return {MIDIPortDeviceState} state
  get state() {
    return this[_private].state;
  }

  // @return {MIDIPortConnectionStateu} connection
  get connection() {
    return 'connected';
  }


  //---- MIDIOutput interfaces ----

  // Sends MIDI messages to this node's input.
  // @param {sequence<octet>} data MIDI messages
  send(data) {
    this[_private].changeState('open');
  }

  // Clears enqued MIDI messages immediately.
  clear() {}
}

global.MIDIOutputAudioNode = MIDIOutputAudioNode;

})(typeof global !== 'undefined' ? global : window);