import React from 'react';

export default function Settings() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="top-header">
        <h1 style={{ fontSize: '20px', fontWeight: 600 }}>Settings</h1>
      </div>
      <div className="settings-container" style={{ overflowY: 'auto', flex: 1 }}>
        <div className="settings-card">
          <h2 className="settings-title">Preferences</h2>
          
          <div className="info-box" style={{ marginTop: '20px' }}>
            <p>
              Settings have been simplified for Vercel deployment. Email notifications and cron jobs are disabled.
            </p>
            <p style={{ marginTop: '8px' }}>
              Future settings for SAML authentication will appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
