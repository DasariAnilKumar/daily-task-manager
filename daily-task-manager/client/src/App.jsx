import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings as SettingsIcon, CheckSquare } from 'lucide-react';
import TaskBoard from './components/TaskBoard';
import Settings from './components/Settings';
import TaskDetail from './components/TaskDetail';

function Layout({ children }) {
  const location = useLocation();
  const activeTab = location.pathname.includes('/settings') ? 'settings' : 'board';

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <CheckSquare size={28} color="var(--primary-color)" />
          <span>TaskFlow</span>
        </div>
        
        <nav>
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
      </div>

      {/* Main Content */}
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<TaskBoard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/task/:id" element={<TaskDetail />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
