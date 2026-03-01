const { contextBridge, ipcRenderer } = require('electron');
const Store = require('electron-store');

const store = new Store();

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  onCaptureText: (fn) => ipcRenderer.on('capture-text', (e, text) => fn(text)),
  readFileBuffer: (filePath) => ipcRenderer.invoke('read-file-buffer', filePath),
  // simple store API
  storeGet: (key) => store.get(key),
  storeSet: (key, val) => store.set(key, val),
  storeDelete: (key) => store.delete(key)
  ,
  readClipboardImage: () => ipcRenderer.invoke('read-clipboard-image')
  ,
  coquiStart: () => ipcRenderer.invoke('coqui-start'),
  coquiStop: () => ipcRenderer.invoke('coqui-stop'),
  onNativeMessage: (fn) => ipcRenderer.on('native-message', (e, msg) => fn(msg)),
  fetchLicenseServerPublicKey: (serverUrl) => ipcRenderer.invoke('fetch-license-server-publickey', serverUrl)
  ,
  coquiDownloadModel: (opts) => ipcRenderer.invoke('coqui-download-model', opts),
  onCoquiDownloadProgress: (fn) => ipcRenderer.on('coqui-download-progress', (e, p) => fn(p)),
  coquiListModels: () => ipcRenderer.invoke('coqui-list-models')
});
