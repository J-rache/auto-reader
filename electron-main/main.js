const { app, BrowserWindow, ipcMain, globalShortcut, clipboard, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const axios = require('axios');
const tar = require('tar');
const crypto = require('crypto');

let mainWindow;
let coquiProcess = null;
const nativeBridgeFile = path.join(__dirname, '..', 'native-bridge', 'messages.json');
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  // Register hotkey: Ctrl+Alt+R to read selected text/clipboard
  globalShortcut.register('CommandOrControl+Alt+R', () => {
    const text = clipboard.readText();
    mainWindow.webContents.send('capture-text', text);
  });

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Simple file-open dialog
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] });
  if (canceled) return null;
  return filePaths;
});

// Read file buffer for renderer (pdf loading)
ipcMain.handle('read-file-buffer', async (event, filePath) => {
  try {
    const data = await fs.promises.readFile(filePath);
    return data;
  } catch (err) {
    console.error('read-file-buffer error', err);
    throw err;
  }
});

// Read image from clipboard as PNG buffer
ipcMain.handle('read-clipboard-image', async () => {
  try {
    const img = clipboard.readImage();
    if (img.isEmpty()) return null;
    const png = img.toPNG();
    return png;
  } catch (err) {
    console.error('read-clipboard-image error', err);
    throw err;
  }
});

// Coqui service control: start/stop
ipcMain.handle('coqui-start', async (event, args) => {
  if (coquiProcess) return { status: 'already_running' };
  try {
    // Try to spawn `python -m coqui_tts.server` (user must have coqui installed)
    coquiProcess = spawn('python', ['-m', 'coqui_tts.server'], { cwd: path.join(__dirname, '..', 'native-helpers', 'coqui'), detached: false });
    coquiProcess.stdout.on('data', (d) => console.log('[coqui]', d.toString()));
    coquiProcess.stderr.on('data', (d) => console.error('[coqui]', d.toString()));
    coquiProcess.on('exit', (code) => { console.log('Coqui exited', code); coquiProcess = null; });
    return { status: 'started' };
  } catch (err) {
    coquiProcess = null;
    console.error('coqui-start error', err);
    return { status: 'error', error: String(err) };
  }
});

ipcMain.handle('coqui-stop', async () => {
  if (!coquiProcess) return { status: 'not_running' };
  try {
    coquiProcess.kill();
    coquiProcess = null;
    return { status: 'stopped' };
  } catch (err) {
    console.error('coqui-stop error', err);
    return { status: 'error', error: String(err) };
  }
});

// Native messaging bridge: watch messages file and forward to renderer
function ensureNativeBridge() {
  const dir = path.join(__dirname, '..', 'native-bridge');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(nativeBridgeFile)) fs.writeFileSync(nativeBridgeFile, '[]');
}
ensureNativeBridge();
fs.watch(nativeBridgeFile, { persistent: false }, (eventType) => {
  if (eventType === 'change') {
    try {
      const raw = fs.readFileSync(nativeBridgeFile, 'utf8');
      const entries = JSON.parse(raw || '[]');
      if (entries && entries.length) {
        // send the last entry
        const last = entries[entries.length - 1];
        if (mainWindow && mainWindow.webContents) mainWindow.webContents.send('native-message', last);
      }
    } catch (err) { console.error('native-bridge read error', err); }
  }
});

// Expose public key endpoint for license verification
ipcMain.handle('fetch-license-server-publickey', async (event, serverUrl) => {
  try {
    // serverUrl like http://localhost:4002
    const url = new URL('/publicKey', serverUrl).toString();
    const res = await fetch(url);
    if (!res.ok) return null;
    const text = await res.text();
    return text;
  } catch (err) {
    console.warn('fetch-license-server-publickey error', err);
    return null;
  }
});

// Coqui model download + install (supports .tar.gz/.tgz archives)
ipcMain.handle('coqui-download-model', async (event, { url, name }) => {
  try {
    const modelsDir = path.join(__dirname, '..', 'native-helpers', 'coqui', 'models');
    if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });
    const tmpFile = path.join(modelsDir, (name || 'model') + '.tmp');
    const writer = fs.createWriteStream(tmpFile);
    const res = await axios({ method: 'get', url, responseType: 'stream' });
    const total = Number(res.headers['content-length'] || 0);
    let downloaded = 0;
    res.data.on('data', chunk => {
      downloaded += chunk.length;
      const percent = total ? Math.round((downloaded / total) * 100) : null;
      if (mainWindow && mainWindow.webContents) mainWindow.webContents.send('coqui-download-progress', { url, name, percent });
    });
    res.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    // If archive is tar.gz or tgz, extract
    if (url.endsWith('.tar.gz') || url.endsWith('.tgz')) {
      await tar.x({ file: tmpFile, cwd: modelsDir });
      fs.unlinkSync(tmpFile);
    } else if (url.endsWith('.zip')) {
      // Not implemented: unzip support
      // Move file as-is
      const dest = path.join(modelsDir, name || path.basename(url));
      fs.renameSync(tmpFile, dest);
    } else {
      const dest = path.join(modelsDir, name || path.basename(url));
      fs.renameSync(tmpFile, dest);
    }
    // notify completion
    if (mainWindow && mainWindow.webContents) mainWindow.webContents.send('coqui-download-progress', { url, name, percent: 100, done: true });
    return { status: 'ok' };
  } catch (err) {
    console.error('coqui-download-model error', err);
    if (mainWindow && mainWindow.webContents) mainWindow.webContents.send('coqui-download-progress', { url, name, percent: 0, error: String(err) });
    throw err;
  }
});

ipcMain.handle('coqui-list-models', async () => {
  const modelsDir = path.join(__dirname, '..', 'native-helpers', 'coqui', 'models');
  if (!fs.existsSync(modelsDir)) return [];
  const items = fs.readdirSync(modelsDir, { withFileTypes: true }).map(d => d.name);
  return items;
});

// Install models from manifest with SHA256 verification
ipcMain.handle('coqui-install-manifest', async () => {
  try {
    const manifestPath = path.join(__dirname, '..', 'native-helpers', 'coqui', 'manifest.json');
    if (!fs.existsSync(manifestPath)) throw new Error('manifest.json not found');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const models = manifest.models || [];
    for (const m of models) {
      const url = m.url;
      const name = m.name || path.basename(url);
      const expected = (m.sha256 || '').toLowerCase();
      if (!url) continue;
      const modelsDir = path.join(__dirname, '..', 'native-helpers', 'coqui', 'models');
      if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });
      const tmpFile = path.join(modelsDir, name + '.tmp');

      const res = await axios({ method: 'get', url, responseType: 'stream' });
      const total = Number(res.headers['content-length'] || 0);
      let downloaded = 0;
      const hash = crypto.createHash('sha256');
      const writer = fs.createWriteStream(tmpFile);
      res.data.on('data', chunk => {
        downloaded += chunk.length;
        hash.update(chunk);
        const percent = total ? Math.round((downloaded / total) * 100) : null;
        if (mainWindow && mainWindow.webContents) mainWindow.webContents.send('coqui-download-progress', { url, name, percent, step: 'download' });
      });
      res.data.pipe(writer);
      await new Promise((resolve, reject) => { writer.on('finish', resolve); writer.on('error', reject); });

      const actual = hash.digest('hex');
      if (expected && expected !== 'replace_with_real_sha256_hash' && actual !== expected.toLowerCase()) {
        fs.unlinkSync(tmpFile);
        if (mainWindow && mainWindow.webContents) mainWindow.webContents.send('coqui-download-progress', { url, name, percent: 0, step: 'verify', error: 'checksum_mismatch' });
        throw new Error(`Checksum mismatch for ${name}`);
      }

      // extract
      if (url.endsWith('.tar.gz') || url.endsWith('.tgz')) {
        await tar.x({ file: tmpFile, cwd: modelsDir });
        fs.unlinkSync(tmpFile);
      } else {
        const dest = path.join(modelsDir, name + path.extname(url));
        fs.renameSync(tmpFile, dest);
      }

      if (mainWindow && mainWindow.webContents) mainWindow.webContents.send('coqui-download-progress', { url, name, percent: 100, step: 'done', done: true });
    }
    return { status: 'ok' };
  } catch (err) {
    console.error('coqui-install-manifest error', err);
    if (mainWindow && mainWindow.webContents) mainWindow.webContents.send('coqui-download-progress', { error: String(err) });
    throw err;
  }
});
