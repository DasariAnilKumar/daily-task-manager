import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { 
  Users, CheckSquare, Bell, Search, ShieldAlert, Mail, 
  ArrowLeft, RefreshCw, Eye, Globe, Activity, Clock 
} from 'lucide-react';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('users'); // 'users' or 'analytics'
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Analytics states
  const [analyticsData, setAnalyticsData] = useState({
    totalViews: 0,
    anonymousViews: 0,
    loggedInViews: 0,
    uniqueLoggedUsers: 0,
    pageStats: [],
    recentLogs: []
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    // Redirect if not authorized
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (user.email.toLowerCase() !== 'anilkumard707@gmail.com') {
        navigate('/');
      }
    }
  }, [user, authLoading, navigate]);

  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setAnalyticsLoading(true);
    }
    setError('');

    // Fetch users list
    try {
      const response = await apiFetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsersList(data);
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to fetch users list');
      }
    } catch (err) {
      setError(err.message || 'Could not connect to the server');
    } finally {
      setLoading(false);
    }

    // Fetch analytics metrics
    try {
      const response = await apiFetch('/api/admin/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error('Failed to fetch visitor analytics:', err);
    } finally {
      setAnalyticsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user.email.toLowerCase() === 'anilkumard707@gmail.com') {
      fetchDashboardData();
    }
  }, [user]);

  // Helper: Format Time string nicely
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' - ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return isoString;
    }
  };

  // Helper: Parse Browser and OS from user agent
  const parseUserAgent = (ua) => {
    if (!ua) return 'Unknown Client';
    let os = 'Unknown OS';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    let browser = 'Browser';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    return `${browser} on ${os}`;
  };

  // Prevent flash of page content for unauthorized/loading states
  if (authLoading || !user || user.email.toLowerCase() !== 'anilkumard707@gmail.com') {
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
        Verifying administrator credentials...
      </div>
    );
  }

  // --- Calculations for Users Tab ---
  const totalUsers = usersList.length;
  const totalTasks = usersList.reduce((acc, curr) => acc + (parseInt(curr.task_count) || 0), 0);
  const totalSubscribers = usersList.filter(u => !!u.email_enabled).length;

  const filteredUsers = usersList.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Calculations for Analytics Tab ---
  const maxPageViews = analyticsData.pageStats.length > 0 ? analyticsData.pageStats[0].count : 1;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top Header */}
      <div className="top-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => navigate('/')} 
            className="date-btn"
            style={{ padding: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center' }}
            title="Back to Board"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            Admin Dashboard
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => fetchDashboardData(true)} 
            className="secondary-btn" 
            disabled={refreshing || loading}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              fontSize: '13px', 
              padding: '8px 14px',
              cursor: 'pointer' 
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'spin-animation' : ''} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid var(--border-color)', 
        padding: '0 32px',
        backgroundColor: 'rgba(0,0,0,0.15)',
        flexShrink: 0
      }}>
        <button 
          onClick={() => setActiveSection('users')}
          style={{
            padding: '16px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeSection === 'users' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeSection === 'users' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Users size={16} />
          User Accounts
        </button>
        <button 
          onClick={() => setActiveSection('analytics')}
          style={{
            padding: '16px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeSection === 'analytics' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeSection === 'analytics' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Activity size={16} />
          Visitor Traffic (missionchecked.com)
        </button>
      </div>

      {/* Main Content Area */}
      <div 
        className="dashboard-scrollable" 
        style={{ 
          overflowY: 'auto', 
          flex: 1, 
          padding: '32px', 
          width: '100%'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Style block for animations */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .spin-animation {
              animation: spin 1s linear infinite;
            }
            .stat-card {
              background-color: var(--bg-sidebar);
              border-radius: 12px;
              padding: 24px;
              border: 1px solid var(--border-color);
              display: flex;
              align-items: center;
              justify-content: space-between;
              transition: transform 0.2s ease, border-color 0.2s ease;
            }
            .stat-card:hover {
              transform: translateY(-2px);
              border-color: rgba(99, 102, 241, 0.4);
            }
            .admin-table {
              width: 100%;
              border-collapse: collapse;
              text-align: left;
              margin-top: 16px;
            }
            .admin-table th {
              padding: 14px 16px;
              color: var(--text-muted);
              font-size: 13px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              border-bottom: 1px solid var(--border-color);
              background-color: rgba(0, 0, 0, 0.1);
            }
            .admin-table td {
              padding: 16px;
              font-size: 14px;
              border-bottom: 1px solid var(--border-color);
              color: var(--text-main);
            }
            .admin-table tbody tr:hover {
              background-color: rgba(255, 255, 255, 0.02);
            }
          `}} />

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              padding: '16px',
              borderRadius: '10px',
              color: '#fca5a5',
              marginBottom: '24px'
            }}>
              <ShieldAlert size={20} style={{ flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 600 }}>Error loading dashboard data</p>
                <p style={{ fontSize: '13px', marginTop: '2px', opacity: 0.9 }}>{error}</p>
              </div>
            </div>
          )}

          {/* TAB 1: USER ACCOUNTS */}
          {activeSection === 'users' && (
            <div>
              {/* Stats Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
                marginBottom: '32px'
              }}>
                <div className="stat-card">
                  <div>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Total Users</p>
                    <h3 style={{ fontSize: '32px', fontWeight: 700, marginTop: '8px', color: 'var(--text-main)' }}>
                      {loading ? '...' : totalUsers}
                    </h3>
                  </div>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary-color)'
                  }}>
                    <Users size={22} />
                  </div>
                </div>

                <div className="stat-card">
                  <div>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Total Tasks Created</p>
                    <h3 style={{ fontSize: '32px', fontWeight: 700, marginTop: '8px', color: 'var(--text-main)' }}>
                      {loading ? '...' : totalTasks}
                    </h3>
                  </div>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(236, 72, 153, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--todo-color)'
                  }}>
                    <CheckSquare size={22} />
                  </div>
                </div>

                <div className="stat-card">
                  <div>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Active Email Subscribers</p>
                    <h3 style={{ fontSize: '32px', fontWeight: 700, marginTop: '8px', color: 'var(--text-main)' }}>
                      {loading ? '...' : totalSubscribers}
                    </h3>
                  </div>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(234, 179, 8, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--in-progress-color)'
                  }}>
                    <Bell size={22} />
                  </div>
                </div>
              </div>

              {/* User Management Section */}
              <div style={{
                backgroundColor: 'var(--bg-sidebar)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)' }}>Registered Users</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      View and track usage across all registered user accounts.
                    </p>
                  </div>

                  {/* Search Bar */}
                  <div style={{ position: 'relative', maxWidth: '320px', width: '100%' }}>
                    <Search 
                      size={18} 
                      color="var(--text-muted)" 
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none'
                      }}
                    />
                    <input 
                      type="text"
                      placeholder="Search users by email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--bg-panel)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-main)',
                        padding: '10px 12px 10px 38px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                    />
                  </div>
                </div>

                {/* Table Container */}
                <div style={{ overflowX: 'auto' }}>
                  {loading ? (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: '60px 0',
                      color: 'var(--text-muted)',
                      gap: '10px'
                    }}>
                      <RefreshCw size={20} className="spin-animation" />
                      <span>Loading users...</span>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                      <Mail size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
                      <p style={{ fontSize: '15px', fontWeight: 500 }}>No users found</p>
                      <p style={{ fontSize: '13px', marginTop: '4px', opacity: 0.8 }}>
                        {searchQuery ? 'Try adjusting your search filter' : 'No user profiles exist in the database'}
                      </p>
                    </div>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>User ID</th>
                          <th>Email Address</th>
                          <th>Daily Email Summary</th>
                          <th>Tasks Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u) => {
                          const isAdmin = u.email.toLowerCase() === 'anilkumard707@gmail.com';
                          return (
                            <tr key={u.id}>
                              <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '13px' }}>
                                {u.id}
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span>{u.email}</span>
                                  {isAdmin && (
                                    <span style={{
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                                      color: '#a5b4fc',
                                      padding: '2px 8px',
                                      borderRadius: '20px',
                                      border: '1px solid rgba(99, 102, 241, 0.3)'
                                    }}>
                                      Admin
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td>
                                {u.email_enabled ? (
                                  <span style={{
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    color: '#10b981',
                                    padding: '4px 10px',
                                    borderRadius: '20px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                                    Enabled
                                  </span>
                                ) : (
                                  <span style={{
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    backgroundColor: 'rgba(160, 160, 160, 0.1)',
                                    color: '#a0a0a0',
                                    padding: '4px 10px',
                                    borderRadius: '20px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#a0a0a0' }}></span>
                                    Disabled
                                  </span>
                                )}
                              </td>
                              <td style={{ fontWeight: 600 }}>
                                {u.task_count}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VISITOR TRAFFIC / ANALYTICS */}
          {activeSection === 'analytics' && (
            <div>
              {/* Analytics Stats Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '24px',
                marginBottom: '32px'
              }}>
                <div className="stat-card">
                  <div>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Total Page Views</p>
                    <h3 style={{ fontSize: '32px', fontWeight: 700, marginTop: '8px', color: 'var(--text-main)' }}>
                      {analyticsLoading ? '...' : analyticsData.totalViews}
                    </h3>
                  </div>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary-color)'
                  }}>
                    <Eye size={22} />
                  </div>
                </div>

                <div className="stat-card">
                  <div>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Logged-In Views</p>
                    <h3 style={{ fontSize: '32px', fontWeight: 700, marginTop: '8px', color: '#10b981' }}>
                      {analyticsLoading ? '...' : analyticsData.loggedInViews}
                    </h3>
                  </div>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981'
                  }}>
                    <Users size={22} />
                  </div>
                </div>

                <div className="stat-card">
                  <div>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Anonymous Views</p>
                    <h3 style={{ fontSize: '32px', fontWeight: 700, marginTop: '8px', color: '#a0a0a0' }}>
                      {analyticsLoading ? '...' : analyticsData.anonymousViews}
                    </h3>
                  </div>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(160, 160, 160, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#a0a0a0'
                  }}>
                    <Globe size={22} />
                  </div>
                </div>

                <div className="stat-card">
                  <div>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Unique Logged Users</p>
                    <h3 style={{ fontSize: '32px', fontWeight: 700, marginTop: '8px', color: 'var(--todo-color)' }}>
                      {analyticsLoading ? '...' : analyticsData.uniqueLoggedUsers}
                    </h3>
                  </div>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(236, 72, 153, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--todo-color)'
                  }}>
                    <Activity size={22} />
                  </div>
                </div>
              </div>

              {/* Two-Column Analytics Layout */}
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '24px',
                flexWrap: 'wrap'
              }}>
                {/* Popular Pages */}
                <div style={{
                  flex: '1 1 360px',
                  backgroundColor: 'var(--bg-sidebar)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '24px',
                  height: 'fit-content'
                }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                    Popular Routes
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                    Most visited pages on missionchecked.com.
                  </p>

                  {analyticsLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      <RefreshCw size={18} className="spin-animation" />
                    </div>
                  ) : analyticsData.pageStats.length === 0 ? (
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
                      No page statistics logged yet.
                    </p>
                  ) : (
                    <div>
                      {analyticsData.pageStats.map((p) => {
                        const pct = Math.round((p.count / maxPageViews) * 100);
                        return (
                          <div key={p.path} style={{ marginBottom: '18px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                              <span style={{ fontFamily: 'monospace', color: 'var(--text-main)', fontWeight: 500 }}>{p.path}</span>
                              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{p.count} views</span>
                            </div>
                            <div style={{ height: '6px', backgroundColor: 'var(--bg-panel)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ 
                                height: '100%', 
                                width: `${pct}%`, 
                                backgroundColor: 'var(--primary-color)', 
                                borderRadius: '3px',
                                transition: 'width 0.6s ease' 
                              }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Live Activity Logs */}
                <div style={{
                  flex: '2 1 600px',
                  backgroundColor: 'var(--bg-sidebar)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '24px'
                }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                    Live Visitor Stream
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Real-time access log of traffic on missionchecked.com.
                  </p>

                  <div style={{ overflowX: 'auto' }}>
                    {analyticsLoading ? (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '60px 0',
                        color: 'var(--text-muted)',
                        gap: '10px'
                      }}>
                        <RefreshCw size={20} className="spin-animation" />
                        <span>Loading activity logs...</span>
                      </div>
                    ) : analyticsData.recentLogs.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        <Clock size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                        <p style={{ fontSize: '14px' }}>No logs recorded yet</p>
                      </div>
                    ) : (
                      <table className="admin-table" style={{ marginTop: 0 }}>
                        <thead>
                          <tr>
                            <th>Time</th>
                            <th>Visitor</th>
                            <th>Page Visited</th>
                            <th>Client / Device</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.recentLogs.map((log) => (
                            <tr key={log.id}>
                              <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                {formatTime(log.timestamp)}
                              </td>
                              <td style={{ fontWeight: 500 }}>
                                {log.email ? (
                                  <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                                    {log.email}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#a0a0a0' }}></span>
                                    Anonymous
                                  </span>
                                )}
                              </td>
                              <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                                {log.path}
                              </td>
                              <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                {parseUserAgent(log.user_agent)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
