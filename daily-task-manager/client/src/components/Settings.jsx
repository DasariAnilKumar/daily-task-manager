import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { Bell } from 'lucide-react';

export default function Settings() {
  const { user, setUser, logout } = useAuth();
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailTime, setEmailTime] = useState('09:00');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [tempTime, setTempTime] = useState('09:00');
  const [tempTimezone, setTempTimezone] = useState('Asia/Kolkata');

  const timeOptions = [
    { value: '00:00', label: '12:00 AM' },
    { value: '01:00', label: '1:00 AM' },
    { value: '02:00', label: '2:00 AM' },
    { value: '03:00', label: '3:00 AM' },
    { value: '04:00', label: '4:00 AM' },
    { value: '05:00', label: '5:00 AM' },
    { value: '06:00', label: '6:00 AM' },
    { value: '07:00', label: '7:00 AM' },
    { value: '08:00', label: '8:00 AM' },
    { value: '09:00', label: '9:00 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '13:00', label: '1:00 PM' },
    { value: '14:00', label: '2:00 PM' },
    { value: '15:00', label: '3:00 PM' },
    { value: '16:00', label: '4:00 PM' },
    { value: '17:00', label: '5:00 PM' },
    { value: '18:00', label: '6:00 PM' },
    { value: '19:00', label: '7:00 PM' },
    { value: '20:00', label: '8:00 PM' },
    { value: '21:00', label: '9:00 PM' },
    { value: '22:00', label: '10:00 PM' },
    { value: '23:00', label: '11:00 PM' }
  ];

  const allTimezones = React.useMemo(() => {
    let list = [];
    try {
      list = Intl.supportedValuesOf('timeZone');
    } catch (e) {
      list = [
        'UTC',
        'Africa/Cairo',
        'Africa/Johannesburg',
        'Africa/Lagos',
        'Africa/Nairobi',
        'America/Anchorage',
        'America/Argentina/Buenos_Aires',
        'America/Bogota',
        'America/Caracas',
        'America/Chicago',
        'America/Denver',
        'America/Halifax',
        'America/Los_Angeles',
        'America/Mexico_City',
        'America/New_York',
        'America/Phoenix',
        'America/Sao_Paulo',
        'America/St_Johns',
        'Asia/Bangkok',
        'Asia/Dhaka',
        'Asia/Dubai',
        'Asia/Hong_Kong',
        'Asia/Jakarta',
        'Asia/Jerusalem',
        'Asia/Kabul',
        'Asia/Karachi',
        'Asia/Kolkata',
        'Asia/Kathmandu',
        'Asia/Manila',
        'Asia/Riyadh',
        'Asia/Seoul',
        'Asia/Shanghai',
        'Asia/Singapore',
        'Asia/Taipei',
        'Asia/Tashkent',
        'Asia/Tokyo',
        'Atlantic/Azores',
        'Atlantic/Cape_Verde',
        'Australia/Adelaide',
        'Australia/Brisbane',
        'Australia/Darwin',
        'Australia/Melbourne',
        'Australia/Perth',
        'Australia/Sydney',
        'Europe/Amsterdam',
        'Europe/Athens',
        'Europe/Berlin',
        'Europe/Brussels',
        'Europe/Istanbul',
        'Europe/Lisbon',
        'Europe/London',
        'Europe/Madrid',
        'Europe/Moscow',
        'Europe/Paris',
        'Europe/Rome',
        'Pacific/Auckland',
        'Pacific/Fiji',
        'Pacific/Honolulu'
      ];
    }
    const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (local && !list.includes(local)) {
      list.push(local);
    }
    return list.sort();
  }, []);

  const getTimezoneAbbr = React.useCallback((tz) => {
    try {
      const formatted = new Date().toLocaleDateString('en-US', { day: 'numeric', timeZone: tz, timeZoneName: 'short' });
      return formatted.split(', ')[1] || tz;
    } catch (e) {
      return tz;
    }
  }, []);

  const getTimezoneDisplay = React.useCallback((tz) => {
    try {
      const date = new Date();
      const offsetFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'longOffset'
      });
      const offsetPart = offsetFormatter.formatToParts(date).find(p => p.type === 'timeZoneName')?.value || '';
      
      const abbrFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'short'
      });
      const abbrPart = abbrFormatter.formatToParts(date).find(p => p.type === 'timeZoneName')?.value || '';
      
      const label = tz.replace('_', ' ');
      let displayLabel = label;
      if (tz === 'Asia/Kolkata') {
        displayLabel = 'Asia/Kolkata (Calcutta)';
      }
      
      if (abbrPart && abbrPart !== offsetPart) {
        return `${displayLabel} (${offsetPart} - ${abbrPart})`;
      }
      return `${displayLabel} (${offsetPart})`;
    } catch (e) {
      return tz.replace('_', ' ');
    }
  }, []);

  const defaultTz = 'Asia/Kolkata';

  useEffect(() => {
    if (user) {
      setEmailEnabled(!!user.email_enabled);
      setEmailTime(user.email_time || '09:00');
      setTimezone(user.timezone || defaultTz);
    }
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('enable') === '1' && !emailEnabled && !showTimeModal) {
      setTempTime(emailTime);
      setTempTimezone(timezone);
      setShowTimeModal(true);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [emailEnabled, emailTime, timezone, showTimeModal]);

  const handleToggleClick = () => {
    if (!emailEnabled) {
      setTempTime(emailTime);
      setTempTimezone(timezone);
      setShowTimeModal(true);
    } else {
      handleDisableEmail();
    }
  };

  const handleDisableEmail = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      const res = await apiFetch('/api/auth/settings', {
        method: 'PUT',
        body: JSON.stringify({ email_enabled: false }),
      });
      if (res.ok) {
        setEmailEnabled(false);
        setUser(prev => ({ ...prev, email_enabled: false }));
        setSuccessMsg('Daily email notifications disabled.');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error('Failed to save email settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmEnableEmail = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      const res = await apiFetch('/api/auth/settings', {
        method: 'PUT',
        body: JSON.stringify({ 
          email_enabled: true, 
          email_time: tempTime,
          timezone: tempTimezone
        }),
      });
      if (res.ok) {
        setEmailEnabled(true);
        setEmailTime(tempTime);
        setTimezone(tempTimezone);
        setUser(prev => ({ ...prev, email_enabled: true, email_time: tempTime, timezone: tempTimezone }));
        const selectedLabel = timeOptions.find(o => o.value === tempTime)?.label || tempTime;
        const abbr = getTimezoneAbbr(tempTimezone);
        setSuccessMsg(`Daily email summary enabled at ${selectedLabel} (${abbr}).`);
        setTimeout(() => setSuccessMsg(''), 3000);
        setShowTimeModal(false);
      }
    } catch (err) {
      console.error('Failed to enable email settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTimeChange = async (e) => {
    const newTime = e.target.value;
    setEmailTime(newTime);
    setSaving(true);
    setSuccessMsg('');
    try {
      const res = await apiFetch('/api/auth/settings', {
        method: 'PUT',
        body: JSON.stringify({ 
          email_enabled: emailEnabled, 
          email_time: newTime,
          timezone: timezone
        }),
      });
      if (res.ok) {
        setUser(prev => ({ ...prev, email_time: newTime, timezone: timezone }));
        const selectedLabel = timeOptions.find(o => o.value === newTime)?.label || newTime;
        const abbr = getTimezoneAbbr(timezone);
        setSuccessMsg(`Delivery time updated to ${selectedLabel} (${abbr}).`);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error('Failed to save email time setting:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTimezoneChange = async (e) => {
    const newTimezone = e.target.value;
    setTimezone(newTimezone);
    setSaving(true);
    setSuccessMsg('');
    try {
      const res = await apiFetch('/api/auth/settings', {
        method: 'PUT',
        body: JSON.stringify({ 
          email_enabled: emailEnabled, 
          email_time: emailTime,
          timezone: newTimezone
        }),
      });
      if (res.ok) {
        setUser(prev => ({ ...prev, timezone: newTimezone }));
        const selectedLabel = timeOptions.find(o => o.value === emailTime)?.label || emailTime;
        const abbr = getTimezoneAbbr(newTimezone);
        setSuccessMsg(`Delivery timezone updated to ${abbr} (${newTimezone}).`);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error('Failed to save email timezone setting:', err);
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
                  Receive an automated email summary of your pending tasks.
                </span>
              </div>
              <button 
                onClick={handleToggleClick}
                disabled={saving}
                className={`toggle-btn ${emailEnabled ? 'active' : ''}`}
                style={{ flexShrink: 0 }}
              >
                <div className="toggle-knob"></div>
              </button>
            </div>

            {emailEnabled && (
              <div style={{ 
                marginTop: '16px', 
                paddingTop: '16px', 
                borderTop: '1px solid var(--border-color)', 
                display: 'flex', 
                flexDirection: 'column',
                gap: '12px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Delivery Time:</span>
                    <select 
                      value={emailTime} 
                      onChange={handleTimeChange}
                      disabled={saving}
                      style={{
                        backgroundColor: 'var(--bg-panel)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-main)',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '14px',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {timeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Timezone:</span>
                    <select 
                      value={timezone} 
                      onChange={handleTimezoneChange}
                      disabled={saving}
                      style={{
                        backgroundColor: 'var(--bg-panel)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-main)',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '14px',
                        outline: 'none',
                        cursor: 'pointer',
                        maxWidth: '220px'
                      }}
                    >
                       {allTimezones.map(tz => (
                        <option key={tz} value={tz}>
                          {getTimezoneDisplay(tz)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

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


        </div>
      </div>

      {/* Timezone Config Modal */}
      {showTimeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '400px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            backgroundColor: '#0d0d0d',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
          }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: '0 0 8px 0' }}>Daily Email Summary</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Choose the local time and timezone you would like to receive your daily pending tasks overview.
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Preferred Delivery Time</label>
              <select 
                value={tempTime}
                onChange={(e) => setTempTime(e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-panel)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                {timeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Timezone</label>
              <select 
                value={tempTimezone}
                onChange={(e) => setTempTimezone(e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-panel)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                 {allTimezones.map(tz => (
                  <option key={tz} value={tz}>
                    {getTimezoneDisplay(tz)}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
              <button 
                onClick={() => setShowTimeModal(false)}
                className="secondary-btn"
                style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmEnableEmail}
                className="primary-btn"
                style={{ 
                  fontSize: '13px', 
                  padding: '8px 16px', 
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  fontWeight: 600
                }}
              >
                Enable Notifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
