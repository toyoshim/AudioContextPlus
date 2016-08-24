(function (global) {
'use strict';

class AudioParamPlus {
  // @param {number} value
  get value () { return 0; }
}

global.AudioParamPlus = AudioParamPlus;

})(typeof global !== 'undefined' ? global : window);