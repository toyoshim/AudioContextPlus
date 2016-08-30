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
    }
    if (_.time >= _.gain) {
      _.loopDataIndex = 0;
      _.nextEvent = _.loopData[0].time;
      _.offset = 0;
      _.time = 0;
      if (_.callback)
        _.callback();
    }
    return _.offset;
  }

  // @param {Array<Object>} loop data
  set data (data) {
    const _ = this[_private];
    _.loopData = [];
    for (let param of data) {
      _.loopData.push({
        time: (param.time * _.gain) | 0,
        offset: (param.offset * _.gain) | 0
      });
    }
    _.loopData.push({ time: _.gain + 1, offset: 0 });
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