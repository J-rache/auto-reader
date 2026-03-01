import React, { useState } from 'react';

export default function CoquiInstaller() {
  const [status, setStatus] = useState('idle');
  const [url, setUrl] = useState('');
  const [models, setModels] = useState([]);
  const [progress, setProgress] = useState(null);

  const refreshModels = async () => {
    const list = await window.electronAPI.coquiListModels();
    setModels(list || []);
  };

  const startCoquiService = async () => {
    setStatus('starting');
    const res = await window.electronAPI.coquiStart();
    setStatus(res.status || 'error');
  };

  const stopCoquiService = async () => {
    setStatus('stopping');
    const res = await window.electronAPI.coquiStop();
    setStatus(res.status || 'error');
  };

  return (
    <div style={{ marginTop: 12 }}>
      <h4>Coqui TTS</h4>
      <div>
        <small>Coqui must be installed on this machine. Use the installer scripts in native-helpers/coqui/</small>
      </div>
      <div style={{ marginTop: 8 }}>
        <input placeholder="Model URL (.tar.gz)" style={{ width: '100%' }} value={url} onChange={e => setUrl(e.target.value)} />
        <div style={{ marginTop: 6 }}>
          <button onClick={async () => {
            if (!url) return alert('Enter model URL');
            setProgress(0);
            window.electronAPI.onCoquiDownloadProgress(p => {
              setProgress(p.percent ?? null);
              if (p.done) refreshModels();
            });
            try {
              await window.electronAPI.coquiDownloadModel({ url, name: 'model' });
              alert('Model download initiated/complete');
              refreshModels();
            } catch (err) {
              alert('Download failed: ' + err.message);
            }
          }}>Download & Install Model</button>
        </div>
        {progress !== null && <div style={{ marginTop: 6 }}>Progress: {progress ?? 'unknown'}%</div>}
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={refreshModels}>Refresh installed models</button>
        <button style={{ marginLeft: 8 }} onClick={async () => {
          setProgress(0);
          window.electronAPI.onCoquiDownloadProgress(p => {
            setProgress(p.percent ?? null);
            if (p.done) refreshModels();
          });
          try {
            await window.electronAPI.coquiInstallManifest();
            alert('Manifest install completed');
            refreshModels();
          } catch (err) {
            alert('Manifest install failed: ' + (err.message || String(err)));
          }
        }}>Install from manifest</button>
        <div style={{ marginTop: 6 }}>
          <strong>Installed models:</strong>
          <ul>{models.map(m => <li key={m}>{m}</li>)}</ul>
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={startCoquiService}>Start Coqui Service</button>
        <button onClick={stopCoquiService} style={{ marginLeft: 8 }}>Stop Coqui Service</button>
      </div>
      <div style={{ marginTop: 8 }}><strong>Status:</strong> {status}</div>
    </div>
  );
}
