(function (global) {
'use strict';

/* global AudioNodePlus */

// A special symbol to hide private members.
const _private = Symbol();

class LoopMakerNode extends AudioNodePlus {
  // @param {Number} gain inner gain
  // @constructor
  constructor (gain) {
    super();
    this[_private] = {
      gain: gain,
      loopData: [],
      loopDataIndex: 0,
      nextEvent: 0,
      offset: 0,
      time: 0,
      delta: 0,
      callback: null
    };
  }

  // Called to update AudioParamPlus in each sample cycle.
  // @return {Number} updated value
  updateParam () {
    const _ = this[_private];
    _.time++;
    if (_.time >= _.nextEvent) {
      _.offset = _.loopData[_.loopDataIndex++].offset;
      _.nextEvent = _.loopData[_.loopDataIndex].time;
      _.delta = _.loopData[_.loopDataIndex].delta;
    } else {
      _.offset += _.delta;
    }
    if (_.time >= _.gain) {
      _.loopDataIndex = 0;
      _.nextEvent = _.loopData[0].time;
      _.offset = 0;
      _.time = 0;
      if (_.callback)
        _.callback();
    }
    return _.offset | 0;
  }

  // @param {Array<Object>} loop data
  set data (data) {
    const _ = this[_private];
    _.loopData = [];
    let time = 0;
    let offset = 0;
    for (let param of data) {
      let delta = 0;
      if (param.mode == 'line')
        delta = (param.offset * _.gain - offset) / (param.time * _.gain - time);
      time = param.time * _.gain;
      offset = param.offset * _.gain;
      _.loopData.push({
        time: time,
        offset: offset,
        delta: delta
      });
    }
    _.loopData.push({ time: _.gain + 1, offset: 0, delta: 0 });
    _.loopDataIndex = 0;
    _.nextEvent = _.loopData[0].time;
    _.offset = 0;
    _.index = 0;
  }

  // @param {Function} callback
  set onloop (callback) { this[_private].callback = callback }
}

global.LoopMakerNode = LoopMakerNode;

})(typeof global !== 'undefined' ? global : window);