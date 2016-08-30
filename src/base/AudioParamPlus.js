(function (global) {
'use strict';

// A special symbol to hide private members.
const _private = Symbol();

class AudioParamPlus {
  // @constructor
  constructor () {
    this[_private] = {
      delegate: null,
      value: 0
    };
  }

  // @param {String} class name
  get className () { return "AudioParamPlus"; }

  // @param {number} value
  get value () { return this[_private].value; }

  // @param {Function} delegate
  set delegate (delegate) { this[_private].delegate = delegate; }

  // @return {Function} delegate
  get delegate () { return this[_private].delegate; }

  // Updates the value if needed.
  update () {
    const _ = this[_private];
    if (_.delegate)
      _.value = _.delegate();
  }
}

global.AudioParamPlus = AudioParamPlus;

})(typeof global !== 'undefined' ? global : window);