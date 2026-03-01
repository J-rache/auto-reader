import React, { useEffect, useState } from 'react';
import PdfReader from './components/PdfReader';
import TTSControls from './components/TTSControls';
import LicensePanel from './components/LicensePanel';
import OCRCapture from './components/OCRCapture';
import LicenseEnforcer from './components/LicenseEnforcer';
import CoquiInstaller from './components/CoquiInstaller';

export default function App() {
  const [capturedText, setCapturedText] = useState('');
  useEffect(() => {
    if (window.electronAPI?.onCaptureText) {
      window.electronAPI.onCaptureText((text) => {
        setCapturedText(text || '');
      });
    }
    const handler = (e) => setCapturedText(e.detail?.text || '');
    window.addEventListener('captured-text-updated', handler);
    const nativeHandler = (msg) => {
      // show native message in captured text area for now
      setCapturedText((prev) => prev + '\n\n[NATIVE] ' + JSON.stringify(msg));
    };
    if (window.electronAPI?.onNativeMessage) window.electronAPI.onNativeMessage(nativeHandler);
    return () => {
      window.removeEventListener('captured-text-updated', handler);
    };
  }, []);
  return (
    <LicenseEnforcer>
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <header style={{ padding: 10, borderBottom: '1px solid #ddd' }}>
        <button onClick={async () => {
          const files = await window.electronAPI.openFile();
          if (files && files[0]) {
            // set selected file into store and send to reader via custom event
            window.electronAPI.storeSet('lastOpened', files[0]);
            const evt = new CustomEvent('file-opened', { detail: { filePath: files[0] } });
            window.dispatchEvent(evt);
          }
        }}>Open file</button>
        <button style={{ marginLeft: 8 }} onClick={async () => {
          // OCR from clipboard image
          const res = await window.electronAPI.readClipboardImage();
          if (!res) return alert('No image in clipboard');
          // dispatch custom event with image buffer (base64)
          const b64 = Buffer.from(res).toString('base64');
          const evt = new CustomEvent('clipboard-image', { detail: { imageBase64: b64 } });
          window.dispatchEvent(evt);
        }}>OCR clipboard image</button>
      </header>
      <main style={{ flex: 1, display: 'flex' }}>
        <div style={{ flex: 1, padding: 12 }}>
          <PdfReader filePath={null} />
        </div>
        <aside style={{ width: 320, borderLeft: '1px solid #eee', padding: 12 }}>
          <h3>Captured text</h3>
          <div style={{ height: 300, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{capturedText || 'Select text in any app and press Ctrl+Alt+R'}</div>
          <TTSControls text={capturedText} />
          <OCRCapture />
          <div style={{ marginTop: 12 }}><LicensePanel /></div>
          <div style={{ marginTop: 12 }}><CoquiInstaller /></div>
        </aside>
      </main>
    </div>
    </LicenseEnforcer>
  );
}
