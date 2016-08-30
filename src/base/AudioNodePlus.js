(function (global) {
'use strict';

class AudioNodePlus {
  // @constructor
  constructor () {}

  // @return {AudioNode} node to be connected
  get node () { return null; }

  // TODO: Accept AudioParamPlus
  // Connects this node's output to destination node.
  // @param {AudioNode} destination destination node
  // @return {AudioNode} destination node
  connect (destination) {
    this.node.connect(destination);
    return destination;
  }

  // TODO: Accept AudioParamPlus
  // Disconnects this node's output from the destionation node. If
  // |destination| is not specified, disconnects from all destination nodes.
  // @return {AudioNode} [destination] destination node
  disconnect (destination) {
    this.node.disconnect(destination);
  }
}

global.AudioNodePlus = AudioNodePlus;

})(typeof global !== 'undefined' ? global : window);