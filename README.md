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

## Sensitive configuration
Create a file named `.env.local` at the repository root to store any private values (API keys, GitHub tokens, etc.).
This file is ignored by Git and will not be pushed.

Example `.env.local`:
```
GH_TOKEN=ghp_your_personal_token_here
```
You can read this variable in the workflow or from the app using a dotenv library if needed.

Build artifacts
- After running `npm run build` the renderer output is in `renderer/dist` and packaging artifacts (AppImage/NSIS) will appear in `dist/` when packaging runs.

If you want me to push a CI-triggering commit now I will commit these small polish changes and push to your repo to start a CI run.
