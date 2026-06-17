import React from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, ArrowRight, LayoutDashboard, Mail, ShieldCheck, LogIn, Sparkles } from 'lucide-react';

export default function Landing() {
  return (
    <div className="landing-container">
      {/* Sticky Header */}
      <header className="landing-nav">
        <Link to="/" className="landing-nav-logo">
          <CheckSquare size={26} color="var(--primary-color)" />
          <span>TaskFlow</span>
        </Link>
        <div className="landing-nav-actions">
          <Link to="/login" className="landing-btn btn-secondary" style={{ padding: '8px 18px', fontSize: '14px' }}>
            Sign In
          </Link>
          <Link to="/register" className="landing-btn btn-primary" style={{ padding: '8px 18px', fontSize: '14px' }}>
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        {/* Left Info Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--primary-color)',
            alignSelf: 'flex-start',
            marginBottom: '16px'
          }}>
            <Sparkles size={14} />
            Introducing TaskFlow 2.0
          </div>
          <h1 className="hero-title">
            Organize work.<br />
            <span className="gradient-text">Automate your day.</span>
          </h1>
          <p className="hero-subtitle">
            TaskFlow brings all your tasks, logs, and progress metrics into a single, automated dashboard. Seamlessly organize, track, and notify yourself without the overhead.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="landing-btn btn-primary">
              Get Started Free <ArrowRight size={18} />
            </Link>
            <a href="#features" className="landing-btn btn-secondary">
              Explore Features
            </a>
          </div>
        </div>

        {/* Right Dashboard Mockup Column */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="glowing-orb orb-primary" style={{ width: '250px', height: '250px', top: '10%' }}></div>
          <div className="glowing-orb orb-secondary" style={{ width: '250px', height: '250px', bottom: '10%' }}></div>

          {/* Interactive Mock Kanban Columns */}
          <div className="glass-container" style={{ width: '100%', gap: '16px', transform: 'perspective(1000px) rotateY(-10deg) rotateX(5deg)', transformStyle: 'preserve-3d' }}>
            {/* Column 1 */}
            <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '8px' }}>
                <span className="status-dot todo"></span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>To Do (1)</span>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Design System Refresh</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Update button states and typography tokens</div>
              </div>
            </div>

            {/* Column 2 */}
            <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '8px' }}>
                <span className="status-dot in-progress"></span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>In Progress (1)</span>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Google Sign-In integration</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Implement GSI SDK button & One Tap verification</div>
              </div>
            </div>

            {/* Column 3 */}
            <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '8px' }}>
                <span className="status-dot done"></span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Done (1)</span>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', opacity: 0.7 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px', textDecoration: 'line-through' }}>User registration API</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Create auth schema, helper crypt, and model</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <span className="section-tag">Product Capabilities</span>
          <h2 className="section-title">Everything you need to work fast</h2>
        </div>

        <div className="features-grid">
          {/* Feature 1 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <LayoutDashboard size={24} />
            </div>
            <h3 className="feature-card-title">Kanban Boards</h3>
            <p className="feature-card-desc">
              Organize daily tasks using simple and responsive columns. Drag and drop to immediately adjust task priorities.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Mail size={24} />
            </div>
            <h3 className="feature-card-title">Automated Summaries</h3>
            <p className="feature-card-desc">
              Get recap summaries of pending and overdue tasks sent directly to your registered email on a customizable schedule.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <ShieldCheck size={24} />
            </div>
            <h3 className="feature-card-title">Bot & Captcha Protection</h3>
            <p className="feature-card-desc">
              Fully fortified against spam bots and brute-force register attempts with Google reCAPTCHA v2 token verification.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <LogIn size={24} />
            </div>
            <h3 className="feature-card-title">Google Authentication</h3>
            <p className="feature-card-desc">
              Skip password credentials completely. Authenticate in a single tap using securely integrated Google Sign-In.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom Call to Action Banner */}
      <section className="cta-banner-section">
        <div className="cta-banner">
          <div className="glowing-orb orb-primary" style={{ width: '400px', height: '400px', left: '-10%', top: '-10%' }}></div>
          <div className="glowing-orb orb-secondary" style={{ width: '400px', height: '400px', right: '-10%', bottom: '-10%' }}></div>
          
          <h2 className="cta-banner-title">Supercharge your workflow today</h2>
          <p className="cta-banner-desc">
            Join thousands of developers and professionals who manage their task flow and email logs without clutter.
          </p>
          <Link to="/register" className="landing-btn btn-primary" style={{ fontSize: '16px', padding: '14px 36px' }}>
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} TaskFlow Inc. All rights reserved. | <Link to="#" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy Policy</Link> | <Link to="#" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms of Service</Link></p>
      </footer>
    </div>
  );
}
