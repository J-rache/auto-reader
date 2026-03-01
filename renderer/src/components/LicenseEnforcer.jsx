import React, { useEffect, useState } from 'react';

export default function LicenseEnforcer({ children }) {
  const [activated, setActivated] = useState(false);
  useEffect(() => {
    (async () => {
      const act = await window.electronAPI.storeGet('activation');
      setActivated(!!(act && act.token));
    })();
  }, []);

  if (activated) return children;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ filter: 'blur(2px)', pointerEvents: 'none' }}>{children}</div>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.9)', zIndex: 9999 }}>
        <div style={{ maxWidth: 680, padding: 20, border: '1px solid #ddd', borderRadius: 8, background: '#fff' }}>
          <h2>Activation required</h2>
          <p>This copy of the app requires activation. Please redeem your voucher in the License panel to continue.</p>
          <p>You can still view limited features in preview mode by opening files, but some features are disabled until activation.</p>
        </div>
      </div>
    </div>
  );
}
