import React, { useEffect, useState } from 'react';
import Tesseract from 'tesseract.js';

export default function OCRCapture() {
  const [ocrText, setOcrText] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      const b64 = e.detail?.imageBase64;
      if (b64) processImageBase64(b64);
    };
    window.addEventListener('clipboard-image', handler);
    return () => window.removeEventListener('clipboard-image', handler);
  }, []);

  async function processImageBase64(b64) {
    try {
      setIsWorking(true);
      const res = await Tesseract.recognize(Buffer.from(b64, 'base64'), 'eng', { logger: m => console.log(m) });
      const text = res?.data?.text || '';
      setOcrText(text);
      // store as captured text so TTSControls can read
      const evt = new CustomEvent('ocr-captured', { detail: { text } });
      window.dispatchEvent(evt);
    } catch (err) {
      console.error('OCR error', err);
      alert('OCR failed: ' + err.message);
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <div style={{ marginTop: 12 }}>
      <h4>OCR Capture</h4>
      <div>
        <small>Use the "OCR clipboard image" button above after taking a screenshot to the clipboard.</small>
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={async () => {
          const res = await window.electronAPI.readClipboardImage();
          if (!res) return alert('No image in clipboard');
          const b64 = Buffer.from(res).toString('base64');
          processImageBase64(b64);
        }} disabled={isWorking}>Read clipboard image now</button>
      </div>
      <div style={{ marginTop: 8, maxHeight: 160, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{ocrText}</div>
    </div>
  );
}
