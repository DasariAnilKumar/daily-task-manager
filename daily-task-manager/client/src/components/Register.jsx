import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, UserPlus } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleClientId, setGoogleClientId] = useState(null);
  const { register, loginWithGoogle } = useAuth();
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
            { theme: 'filled_blue', size: 'large', width: '356' }
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
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!captchaToken) {
      setError('Please complete the reCAPTCHA verification');
      return;
    }
    setError('');
    setSubmitting(true);

    const res = await register(email, password, captchaToken);
    setSubmitting(false);

    if (res.success) {
      navigate('/');
    } else {
      setError(res.error || 'Registration failed');
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      width: '100%',
      backgroundColor: 'var(--bg-dark)',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: 'var(--bg-sidebar)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '40px 32px',
        boxShadow: 'var(--shadow-xl)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckSquare size={30} color="var(--primary-color)" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px' }}>Create account</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Get started with your task dashboard</p>
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
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey="6LeRSiQtAAAAAK2yXmXU28Xr8qSEH8_qmMUBz5ig"
              onChange={(token) => setCaptchaToken(token)}
              onExpired={() => setCaptchaToken(null)}
              theme="dark"
            />
          </div>

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
            <UserPlus size={18} />
            {submitting ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {googleClientId ? (
            <div id="google-signin-button" style={{ width: '100%', minHeight: '40px' }}></div>
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
              Sign Up with Google
            </button>
          )}
        </div>

        <div style={{
          textAlign: 'center',
          fontSize: '14px',
          color: 'var(--text-muted)',
          marginTop: '8px'
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
