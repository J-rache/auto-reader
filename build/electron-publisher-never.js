// Minimal stub to satisfy electron-builder when --publish=never is used in CI.
// Electron-builder attempts to require a provider module named
// 'electron-publisher-<provider>' from the project's build/ directory.
// When using --publish=never it looks for electron-publisher-never.js.
// This stub is a no-op provider to avoid MODULE_NOT_FOUND errors in CI.

class NeverPublisher {
  constructor(context) {
    this.context = context
  }

  // Called by app-builder-lib when resolving publish providers. No-op.
  async upload(/*data*/) {
    // intentionally empty
    return Promise.resolve()
  }
}

module.exports = NeverPublisher
