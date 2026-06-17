import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { Shield, Bell } from 'lucide-react';

export default function Settings() {
  const { user, setUser, logout } = useAuth();
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (user) {
      setEmailEnabled(!!user.email_enabled);
    }
  }, [user]);

  const handleToggleEmail = async () => {
    setSaving(true);
    setSuccessMsg('');
    const newStatus = !emailEnabled;
    try {
      const res = await apiFetch('/api/auth/settings', {
        method: 'PUT',
        body: JSON.stringify({ email_enabled: newStatus }),
      });
      if (res.ok) {
        setEmailEnabled(newStatus);
        setUser(prev => ({ ...prev, email_enabled: newStatus }));
        setSuccessMsg(newStatus ? 'Daily email notifications enabled!' : 'Daily email notifications disabled.');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error('Failed to save email settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="top-header">
        <h1 style={{ fontSize: '20px', fontWeight: 600 }}>Settings</h1>
      </div>
      
      <div className="settings-container" style={{ overflowY: 'auto', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* User Account Info */}
          <div className="settings-card" style={{ gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-color)',
                fontWeight: 'bold',
                fontSize: '18px'
              }}>
                {user?.email?.[0]?.toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Account Profile</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{user?.email}</p>
              </div>
            </div>
            
            <button 
              onClick={logout}
              className="secondary-btn"
              style={{
                color: '#ef4444',
                borderColor: 'rgba(239, 68, 68, 0.2)',
                alignSelf: 'flex-start',
                marginTop: '8px',
                fontSize: '13px',
                padding: '8px 16px'
              }}
            >
              Sign Out
            </button>
          </div>

          {/* Preferences Settings */}
          <div className="settings-card">
            <h2 className="settings-title" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Bell size={20} color="var(--primary-color)" /> Notification Preferences
            </h2>
            
            <div className="toggle-container" style={{ padding: '8px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, paddingRight: '16px' }}>
                <span style={{ fontWeight: 500, fontSize: '15px' }}>Daily Email Summary</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Receive a summary of your pending tasks every day at 8:10 PM IST.
                </span>
              </div>
              <button 
                onClick={handleToggleEmail}
                disabled={saving}
                className={`toggle-btn ${emailEnabled ? 'active' : ''}`}
                style={{ flexShrink: 0 }}
              >
                <div className="toggle-knob"></div>
              </button>
            </div>

            {successMsg && (
              <div style={{
                fontSize: '13px',
                color: '#86efac',
                backgroundColor: 'rgba(34, 197, 94, 0.05)',
                border: '1px solid rgba(34, 197, 94, 0.1)',
                padding: '8px 12px',
                borderRadius: '6px',
                marginTop: '12px'
              }}>
                {successMsg}
              </div>
            )}
          </div>

          {/* System Info Box */}
          <div className="info-box">
            <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
              <Shield size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ fontWeight: 500, marginBottom: '4px' }}>System Configuration</p>
                <p style={{ lineHeight: 1.5, fontSize: '13px', color: '#a5b4fc' }}>
                  This application connects to a secure PostgreSQL database. Email services are processed dynamically using Nodemailer SMTP relays on Vercel cron endpoints.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
