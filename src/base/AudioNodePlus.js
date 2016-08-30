(function (global) {
'use strict';

class AudioNodePlus {
  // @constructor
  constructor () {}

  // @return {AudioNode} node to be connected
  get node () { return null; }

  // Called to update AudioParamPlus in each sample cycle.
  // @return {Number} updated value
  updateParam () { return 0; }

  // Connects this node's output to destination node.
  // @param {AudioNode|AudioParamPlus} destination destination node
  // @return {AudioNode|AudioParamPlus} destination node
  connect (destination) {
    if (destination.__proto__.constructor.name == 'AudioParamPlus')
      destination.delegate = this.updateParam.bind(this);
    else
      this.node.connect(destination);
    return destination;
  }

  // TODO: Accept AudioParamPlus
  // Disconnects this node's output from the destionation node. If
  // |destination| is not specified, disconnects from all destination nodes.
  // @return {AudioNode|AudioParamPlus} [destination] destination node
  disconnect (destination) {
    if (destination.__proto__.constructor.name == 'AudioParamPlus')
      destination.delegate = null;
    else
      this.node.disconnect(destination);
  }
}

global.AudioNodePlus = AudioNodePlus;

})(typeof global !== 'undefined' ? global : window);