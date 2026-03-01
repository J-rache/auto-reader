# Reader Electron — Scaffold

Quickstart:

1. Install dependencies (root and license server)
   ```bash
   npm install
   cd license-server
   npm install
   cd ..
   ```

2. Start license server (for activation)
   ```bash
   cd license-server
   npm start
   ```

   Create a voucher for testing:
   ```bash
   curl -X POST http://localhost:4002/voucher
   ```

3. Start app in development
   ```bash
   npm run dev-all
   ```
   Then press Ctrl+Alt+R in any app to copy selected text to the app and press Play.

Notes:
- Coqui TTS integration is optional: see `native-helpers/coqui/README.md`.
- This is a scaffold. Replace placeholder components with full `pdf.js` and `epub.js` readers.
- Do NOT circumvent DRM — users must only capture/read content they own or have rights to view.
