class NeverPublisher {
  constructor(context) {
    this.context = context
  }
  async upload() {
    return Promise.resolve()
  }
}

module.exports = NeverPublisher
