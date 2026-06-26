import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, LogIn, Activity, Clock, Sparkles } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleClientId, setGoogleClientId] = useState(null);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  React.useEffect(() => {
    // Fetch Google Client ID from backend
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/auth/config');
        if (res.ok) {
          const data = await res.json();
          setGoogleClientId(data.googleClientId);
        }
      } catch (err) {
        console.error('Failed to fetch authentication config:', err);
      }
    };
    fetchConfig();
  }, []);

  React.useEffect(() => {
    if (!googleClientId) return;

    const initGoogle = () => {
      if (!window.google) {
        setTimeout(initGoogle, 100);
        return;
      }

      const handleCredentialResponse = async (response) => {
        setSubmitting(true);
        setError('');
        const res = await loginWithGoogle(response.credential);
        setSubmitting(false);
        if (res.success) {
          navigate('/');
        } else {
          setError(res.error || 'Google login failed');
        }
      };

      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleCredentialResponse,
        });

        const btnElem = document.getElementById('google-signin-button');
        if (btnElem) {
          window.google.accounts.id.renderButton(
            btnElem,
            { theme: 'filled_blue', size: 'large', width: '360' }
          );
        }

        window.google.accounts.id.prompt();
      } catch (err) {
        console.error('Error rendering Google Sign-In:', err);
      }
    };

    initGoogle();
  }, [googleClientId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (!captchaToken) {
      setError('Please complete the reCAPTCHA verification');
      return;
    }
    setError('');
    setSubmitting(true);

    const res = await login(email, password, captchaToken);
    setSubmitting(false);

    if (res.success) {
      navigate('/');
    } else {
      setError(res.error || 'Invalid email or password');
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setCaptchaToken(null);
    }
  };

  const handleGoogleDemoLogin = async () => {
    setSubmitting(true);
    setError('');
    const res = await loginWithGoogle(null, true);
    setSubmitting(false);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.error || 'Google Demo login failed');
    }
  };

  return (
    <div className="split-container">
      {/* Left Column: Form */}
      <div className="form-side">
        <div className="auth-card">
          <div className="form-box">
            {/* Logo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckSquare size={26} color="#ffffff" />
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px' }}>Welcome back</h1>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Enter your details to sign in</p>
            </div>

            {error && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '13px',
                color: '#fca5a5',
                lineHeight: 1.4
              }}>
                {error}
              </div>
            )}

            {/* 1. Google Sign-In Button */}
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              {googleClientId ? (
                <div style={{ colorScheme: 'light', width: '100%' }}>
                  <div id="google-signin-button" style={{ width: '100%', minHeight: '40px' }}></div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleDemoLogin}
                  className="google-btn"
                  disabled={submitting}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Sign In with Google
                </button>
              )}
            </div>

            {/* 2. Divider Line */}
            <div className="divider-container">
              <div className="divider-line"></div>
              <span className="divider-text">Or sign in with email</span>
              <div className="divider-line"></div>
            </div>

            {/* 3. Form Inputs */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              {/* 4. reCAPTCHA */}
              <div className="recaptcha-container" style={{ colorScheme: 'light' }}>
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey="6LeRSiQtAAAAAK2yXmXU28Xr8qSEH8_qmMUBz5ig"
                  onChange={(token) => setCaptchaToken(token)}
                  onExpired={() => setCaptchaToken(null)}
                  theme="dark"
                />
              </div>

              {/* 5. Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="primary-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  height: '46px',
                  marginTop: '8px'
                }}
              >
                <LogIn size={18} />
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* 6. Terms disclaimer */}
            <p className="agreement-text">
              I agree to abide by MissionChecked's <Link to="#">Terms of Service</Link> and its <Link to="#">Privacy Policy</Link>
            </p>

            {/* 7. Link to signup */}
            <div style={{
              textAlign: 'center',
              fontSize: '14px',
              color: 'var(--text-muted)',
              marginTop: '8px'
            }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Visual Graphics */}
      <div className="graphic-side">
        <div className="glowing-orb orb-primary"></div>
        <div className="glowing-orb orb-secondary"></div>
        
        <div className="glass-container">
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 24px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Sparkles size={20} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#ffffff' }}>MissionChecked Workspace</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Manage tasks with speed and simplicity</p>
            </div>
          </div>

          <div className="glass-card">
            <div className="glass-card-title">
              <Activity size={16} color="var(--primary-color)" />
              Weekly Completion Rate
            </div>
            <div className="glass-card-body">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>84%</span>
                <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>+4% this week</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '84%', height: '100%', backgroundColor: 'var(--primary-color)', borderRadius: '3px' }}></div>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <div className="glass-card-title">
              <Clock size={16} color="var(--in-progress-color)" />
              Overdue Tasks
            </div>
            <div className="glass-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>Database migration</span>
                <span style={{ color: 'var(--todo-color)', fontWeight: 600 }}>Overdue</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>Email automation test</span>
                <span style={{ color: 'var(--in-progress-color)', fontWeight: 600 }}>Today</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
