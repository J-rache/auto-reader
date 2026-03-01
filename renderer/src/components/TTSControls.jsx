import React, { useState, useEffect, useRef } from 'react';
import { synthesizeWithCoqui } from '../services/coquiClient';

export default function TTSControls({ text }) {
  const [rate, setRate] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utterRef = useRef(null);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    // listen for OCR captured events
    const handler = (e) => {
      const t = e.detail?.text;
      if (t) {
        // set as text to read
        // NOTE: parent passes text prop; this just logs
        // place OCR text into store as captured text so sidebar updates
        window.electronAPI.storeSet('lastCapturedText', t);
        // also dispatch event for UI
        const evt = new CustomEvent('captured-text-updated', { detail: { text: t } });
        window.dispatchEvent(evt);
      }
    };
    window.addEventListener('ocr-captured', handler);
    return () => window.removeEventListener('ocr-captured', handler);
  }, []);

  const speak = () => {
    if (!text) return;
    if (useCoqui) {
      // try Coqui local service
      synthesizeWithCoqui(text).then(playAudioBlob).catch(err => {
        console.warn('Coqui synth failed, falling back to Web Speech', err);
        speakWithWebSpeech(text);
      });
    } else {
      speakWithWebSpeech(text);
    }
  };

  function speakWithWebSpeech(txt) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(txt);
    u.rate = rate;
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
    utterRef.current = u;
  }

  function playAudioBlob(ab) {
    const blob = new Blob([ab], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => setIsSpeaking(false);
    audio.play();
    setIsSpeaking(true);
  }

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <label><input type="checkbox" checked={useCoqui} onChange={e => setUseCoqui(e.target.checked)} /> Use Coqui local TTS (if available)</label>
      </div>
      <div>
        <label>Rate: </label>
        <input type="range" min="0.5" max="2" step="0.1" value={rate} onChange={e => setRate(Number(e.target.value))} />
        <span>{rate}x</span>
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={speak} disabled={!text || isSpeaking}>Play</button>
        <button onClick={stop} disabled={!isSpeaking}>Stop</button>
      </div>
    </div>
  );
}
