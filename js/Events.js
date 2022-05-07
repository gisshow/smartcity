
class Events {

  constructor () {
    this.listeners = {};
  }

  on (type, callback) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  }

  off (type, callback) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter(listener => listener !== callback);
    }
  }

  emit (type, payload) {
    // return new Promise(resolve => {
      // setTimeout(t => {
        let res = true;
        (this.listeners[type] || []).forEach(listener => {
          if (listener(payload) === false) {
            res = false;
            // break?
          }
        });
        return res;
        // resolve(res);
      // }, 0);
    // });
  }
}
