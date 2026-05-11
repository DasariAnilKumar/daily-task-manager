import React from 'react';

export default function Settings() {
  return (
    <div className="settings-container">
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
  );
}
