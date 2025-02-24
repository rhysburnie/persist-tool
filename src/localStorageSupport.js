const localStorageSupport = {
  has: false,
  can: false,
  exceeded: false,
  check() {
    try {
      this.has = 'localStorage' in window && localStorage !== null;
      // if disabled in firefox it exists as null
    } catch (err) {
      // if disabled in chrome it exists but throws exception if you try to access it
    }
  
    this.can = this.has;
  
    if (this.can) {
      // it "has" but "can" it?
      try {
        window.localStorage.setItem('localStorageSupport', 'true');
        window.localStorage.removeItem('localStorageSupport');
      } catch (err) {
        try {
          if (window.localStorage.length === 0) {
            this.can = false;
          } else {
            this.exceeded = err;
          }
        } catch (err) {}
      }
    }
  }
}

localStorageSupport.check();

export default localStorageSupport;