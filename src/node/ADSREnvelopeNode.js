(function (global) {
'use strict';

/* global AudioContext */
/* global AudioNodePlus */

// A special symbol to hide private members.
const _private = Symbol();

class ADSREnvelopeNode extends AudioNodePlus {
  // @param {AudioContext} [context] AudioContext
  // @constructor
  constructor(context) {
    super();
    this[_private] = {
      context: context || new AudioContext,
      destinations: [],
      velocity: 0,
      gain: null
    };
    this.a = 0;
    this.d = 0;
    this.s = 1;
    this.r = 0;
    const _ = this[_private];
    _.gain = _.context.createGain();
    _.gain.gain.value = 0;
  }

  // @return {AudioNode} node to be connected.
  get node() { return this[_private].gain; }

  // Handles note on event.
  // @param {number} velocity velocity
  on(velocity) {
    const _ = this[_private];
    _.gain.gain.cancelScheduledValues(0);
    _.velocity = velocity;
    const attackTime = _.context.currentTime;
    const decayTime = attackTime + 2 * this.a;
    // Note: sustainRate should be greater than 0.
    // See https://github.com/WebAudio/web-audio-api/issues/850
    const sustainRate = 2 * this.d + 0.001;
    const sustainLevel = _.velocity * this.s;
    _.gain.gain.setValueAtTime(0, attackTime);
    _.gain.gain.linearRampToValueAtTime(velocity, decayTime);
    _.gain.gain.setTargetAtTime(sustainLevel, decayTime, sustainRate);
  }

  // Handles note off event.
  off() {
    const _ = this[_private];
    _.gain.gain.cancelScheduledValues(0);
    const releaseLevel = _.gain.gain.value;
    const releaseTime = _.context.currentTime;
    _.gain.gain.cancelScheduledValues(releaseTime);
    // https://github.com/WebAudio/web-audio-api/issues/850
    let releaseRate = 2 * this.r + 0.001;
    _.gain.gain.setValueAtTime(releaseLevel, releaseTime);
    _.gain.gain.setTargetAtTime(0, releaseTime, releaseRate);
  }
}

global.ADSREnvelopeNode = ADSREnvelopeNode;

})(typeof global !== 'undefined' ? global : window);
