import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Settings as SettingsIcon, CheckSquare, LogOut } from 'lucide-react';
import TaskBoard from './components/TaskBoard';
import Settings from './components/Settings';
import TaskDetail from './components/TaskDetail';
import Login from './components/Login';
import Register from './components/Register';
import Landing from './components/Landing';
import { AuthProvider, useAuth } from './context/AuthContext';

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
  const activeTab = location.pathname.includes('/settings') ? 'settings' : 'board';
  const { user, token, logout } = useAuth();

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
          <span>TaskFlow</span>
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
    </div>
  );
}

function HomeRoute() {
  const { token } = useAuth();
  return token ? <ProtectedRoute><TaskBoard /></ProtectedRoute> : <Landing />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<HomeRoute />} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/task/:id" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
