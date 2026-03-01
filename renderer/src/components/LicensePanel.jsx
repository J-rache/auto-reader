import React, { useEffect, useState } from 'react';
import { redeemVoucher, getActivationStatus, deactivateActivation, generateClientKeyIfNeeded } from '../services/licenseClient';

export default function LicensePanel() {
  const [voucher, setVoucher] = useState('');
  const [status, setStatus] = useState(null);
  const [clientKey, setClientKey] = useState(null);

  useEffect(() => {
    (async () => {
      const pub = await window.electronAPI.storeGet('client_pubkey');
      setClientKey(pub || null);
      const s = await getActivationStatus();
      setStatus(s);
    })();
  }, []);

  const [passphrase, setPassphrase] = useState('');

  const onGenerate = async () => {
    const pub = await generateClientKeyIfNeeded();
    setClientKey(pub);
    alert('Client key generated and stored locally. Use it to redeem a voucher.');
  };

  const onRedeem = async () => {
    try {
      const res = await redeemVoucher(voucher.trim());
      setStatus(res);
      alert('Redeemed: ' + JSON.stringify(res));
    } catch (err) {
      alert('Redeem failed: ' + (err?.response?.data?.error || err.message));
    }
  };

  const onDeactivate = async () => {
    await deactivateActivation();
    setStatus(null);
    alert('Deactivated');
  };

  const onEncrypt = async () => {
    if (!passphrase) return alert('Enter a passphrase');
    try {
      await import('../services/licenseClient').then(mod => mod.encryptPrivateKeyWithPassphrase(passphrase));
      alert('Private key encrypted with passphrase');
    } catch (err) {
      alert('Encrypt failed: ' + err.message);
    }
  };

  const onDecrypt = async () => {
    if (!passphrase) return alert('Enter passphrase');
    try {
      await import('../services/licenseClient').then(mod => mod.decryptPrivateKeyWithPassphrase(passphrase));
      alert('Private key decrypted and available for use');
    } catch (err) {
      alert('Decrypt failed: ' + err.message);
    }
  };

  return (
    <div style={{ padding: 12, border: '1px solid #eee', marginTop: 12 }}>
      <h4>License</h4>
      <div>
        <button onClick={onGenerate}>Generate client key</button>
      </div>
      <div style={{ marginTop: 8 }}>
        <input placeholder="Voucher code" value={voucher} onChange={e => setVoucher(e.target.value)} />
        <button onClick={onRedeem} disabled={!voucher}>Redeem</button>
      </div>
      <div style={{ marginTop: 8 }}>
        <input placeholder="Passphrase (for private key)" type="password" value={passphrase} onChange={e => setPassphrase(e.target.value)} />
        <button onClick={onEncrypt} style={{ marginLeft: 6 }}>Encrypt private key</button>
        <button onClick={onDecrypt} style={{ marginLeft: 6 }}>Decrypt private key</button>
      </div>
      <div style={{ marginTop: 8 }}>
        <strong>Activation status:</strong>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{status ? JSON.stringify(status, null, 2) : 'Not activated'}</pre>
        {status && <button onClick={onDeactivate}>Deactivate</button>}
      </div>
    </div>
  );
}
