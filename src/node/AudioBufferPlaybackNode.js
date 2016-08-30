(function (global) {
'use strict';

/* global AudioContext */
/* global AudioNodePlus */
/* global AudioParamPlus */

// A special symbol to hide private members.
const _private = Symbol();

class AudioBufferPlaybackNode extends AudioNodePlus {
  // @param {AudioContext} [context] AudioContext
  // @constructor
  constructor (context) {
    super();
    this[_private] = {
      context: context || new AudioContext,
      node: null,
      buffer: null,
      phaseOffset: new AudioParamPlus,
      offset: 0,
      play: false
    };
    const _ = this[_private];
    _.node = _.context.createScriptProcessor(0, 0, 2);
    _.node.onaudioprocess = function (e) {
      const _ = this[_private];
      if (!_.buffer || !_.play)
        return;
      let lin = null;
      let rin = null;
      if (_.buffer.numberOfChannels == 1) {
        lin = rin = _.buffer.getChannelData(0);
      } else if (_.buffer.numberOfChannels == 2) {
        lin = _.buffer.getChannelData(0);
        rin = _.buffer.getChannelData(1);
      }
      const out = e.outputBuffer;
      const lout = out.getChannelData(0);
      const rout = out.getChannelData(1);

      for (let i = 0; i < out.length; ++i) {
        let offset = _.offset++;
        _.phaseOffset.update();
        offset += _.phaseOffset.value;
        offset %= _.buffer.length;
        lout[i] = lin[offset];
        rout[i] = rin[offset];
      }
      _.offset %= _.buffer.length;
    }.bind(this);
  }

  // @return {AudioNode} node to be connected
  get node () { return this[_private].node; }

  // @param {AudioBuffer} buffer instance to play
  set buffer (buffer) { this[_private].buffer = buffer; }
  // @return {AudioBuffer} current buffer instance to play
  get buffer () { return this[_private].buffer; }
  
  // @return {AudioParamPlus} current phaseOffset
  get phaseOffset () { return this[_private].phaseOffset; }

  // Schedules a sound to playback.
  start () {
    const _ = this[_private];
    _.offset = 0;
    _.play = true;
  }

  // Schedules a sound to stop playback.
  stop () {
    const _ = this[_private];
    _.play = false;
  }
}

global.AudioBufferPlaybackNode = AudioBufferPlaybackNode;

})(typeof global !== 'undefined' ? global : window);