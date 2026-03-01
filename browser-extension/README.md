Browser extension prototype

This is a minimal prototype for extracting article content from a webpage using Readability.

Usage:
- Load as an unpacked extension in Chrome/Edge (chrome://extensions) or Firefox (about:debugging for temporary load).
- Click the extension action on a news/article page to extract content. Current prototype logs content to the console and shows an alert.

Next steps to integrate with native app:
- Implement native messaging host manifest on each OS and a small host to accept messages from the extension and forward to the Electron app.
- Replace inline Readability with packaged script or content script that injects Readability properly.
