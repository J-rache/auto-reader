// Root-level no-op publisher to satisfy electron-builder's require('electron-publisher-never')
class NeverPublisher {
  constructor(context) {
    this.context = context
  }
  async upload() {
    return Promise.resolve()
  }
}

module.exports = NeverPublisher
