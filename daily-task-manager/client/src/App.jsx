import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Settings as SettingsIcon, CheckSquare, LogOut, Shield, Bell } from 'lucide-react';
import TaskBoard from './components/TaskBoard';
import Settings from './components/Settings';
import TaskDetail from './components/TaskDetail';
import Login from './components/Login';
import Register from './components/Register';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { apiFetch } from './utils/api';
import { Analytics } from '@vercel/analytics/react';

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-dark)',
        color: 'var(--text-muted)',
        fontFamily: 'Inter, sans-serif'
      }}>
        Loading session...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  let activeTab = 'board';
  if (location.pathname.includes('/settings')) {
    activeTab = 'settings';
  } else if (location.pathname.includes('/dashboard')) {
    activeTab = 'dashboard';
  }
  const { user, token, logout, setUser } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Only prompt if logged in, notifications disabled, and not on /settings or /dashboard currently
    if (user && user.email_enabled === false && !location.pathname.includes('/settings') && !location.pathname.includes('/dashboard')) {
      const lastDismissed = localStorage.getItem('last_notif_prompt_dismiss');
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
      
      const shouldPrompt = !lastDismissed || (Date.now() - parseInt(lastDismissed) > threeDaysInMs);
      
      if (shouldPrompt) {
        // Show the prompt modal after a 5 second delay
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, location.pathname]);

  const handleDismiss = () => {
    localStorage.setItem('last_notif_prompt_dismiss', Date.now().toString());
    setShowPrompt(false);
  };

  const handleEnable = () => {
    setShowPrompt(false);
    navigate('/settings?enable=1');
  };

  // Do not show the navigation wrapper on login/register pages or when showing the landing page
  if (
    location.pathname === '/login' || 
    location.pathname === '/register' || 
    (location.pathname === '/' && !token)
  ) {
    return children;
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <CheckSquare size={28} color="var(--primary-color)" />
          <span>MissionChecked</span>
        </div>
        
        <nav style={{ flex: 1 }}>
          <Link 
            to="/"
            className={`nav-item ${activeTab === 'board' ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} />
            Board View
          </Link>
          
          <Link 
            to="/settings"
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <SettingsIcon size={20} />
            Settings
          </Link>

          {user?.email?.toLowerCase() === 'anilkumard707@gmail.com' && (
            <Link 
              to="/dashboard"
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
              <Shield size={20} />
              Admin Dashboard
            </Link>
          )}
        </nav>

        {/* User profile footer in Sidebar */}
        <div className="sidebar-footer" style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '16px',
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            padding: '0 8px'
          }}>
            {user?.email}
          </div>
          <button 
            onClick={logout}
            className="nav-item"
            style={{
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 16px',
              margin: 0,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              width: '100%',
              textAlign: 'left'
            }}
          >
            <LogOut size={20} />
            <span className="btn-text">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {children}
      </div>

      {/* Email Notification Prompt Modal */}
      {showPrompt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from { transform: translateY(20px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
            .modal-card {
              animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}} />
          <div className="modal-card" style={{
            backgroundColor: 'var(--bg-sidebar)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '440px',
            width: '90%',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            color: 'var(--text-main)'
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-color)',
                flexShrink: 0
              }}>
                <Bell size={24} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Stay on Track!</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Would you like to receive a daily summary of your pending tasks directly in your inbox?
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button 
                onClick={handleDismiss}
                disabled={saving}
                className="secondary-btn"
                style={{ 
                  padding: '10px 18px', 
                  fontSize: '14px', 
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  borderRadius: '8px',
                  fontWeight: 500
                }}
              >
                Not Now
              </button>
              <button 
                onClick={handleEnable}
                disabled={saving}
                className="primary-btn"
                style={{ 
                  padding: '10px 20px', 
                  fontSize: '14px', 
                  cursor: 'pointer',
                  backgroundColor: 'var(--primary-color)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = 'var(--primary-hover)'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'var(--primary-color)'}
              >
                {saving ? 'Enabling...' : 'Yes, Enable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PageTracker() {
  const location = useLocation();

  useEffect(() => {
    const logVisit = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        await fetch('/api/analytics/log', {
          method: 'POST',
          headers,
          body: JSON.stringify({ path: location.pathname }),
        });
      } catch (err) {
        console.error('Failed to log page view:', err);
      }
    };
    logVisit();
  }, [location]);

  return null;
}

function HomeRoute() {
  const { token } = useAuth();
  return token ? <ProtectedRoute><TaskBoard /></ProtectedRoute> : <Landing />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PageTracker />
        <Analytics />
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<HomeRoute />} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/task/:id" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
