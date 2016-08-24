'user strict'; { // begin private scope

/* global AudioContext */

// A special symbol to hide private members.
const _private = Symbol();

class AudioContextPlus extends AudioContext {
  // @constructor
  constructor() {
    super();
    this[_private] = {};
  }

  // @param {string} URL
  // @return {Promise} promise
  loadAudioData(url) {
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
  }
}

this.AudioContextPlus = AudioContextPlus;

} // end private scope