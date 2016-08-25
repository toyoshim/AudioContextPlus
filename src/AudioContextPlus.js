'use strict';

/* global AudioContext */
/* global AudioBufferPlaybackNode */

// Fetches audio file of |url| and creates AudioBuffer.
// @param {string} URL
// @return {Promise<AutioBuffer>} promise
AudioContext.prototype.loadAudioData = function (url)  {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.onreadystatechange = () => {
      if (xhr.readyState != xhr.DONE)
        return;
      if (xhr.status !== 200)
        return reject(xhr);
      this.decodeAudioData(xhr.response).then(buffer => {
        resolve(buffer);
      }, e => {
        reject(e);
      });
    };
    xhr.open('GET', url, true);
    xhr.send();
  });
};

// Creates AudioBufferPlaybackNode with this AudioContext.
// @return {AudioBufferPlaybackNode} created node
AudioContext.prototype.createBufferPlayback = function () {
  return new AudioBufferPlaybackNode(this);
}