import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, ArrowRight, Sparkles } from 'lucide-react';

export default function Landing() {
  const words = ['tasks', 'summaries', 'workflow', 'time'];
  const [wordIndex, setWordIndex] = useState(0);
  const [animationClass, setAnimationClass] = useState('word-slide-in');

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationClass('word-slide-out');
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % words.length);
        setAnimationClass('word-slide-in');
      }, 400); // match animation duration
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="landing-container">
      {/* CSS Animations & Responsive Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .landing-container {
          height: 100vh; 
          overflow: hidden; 
          display: flex; 
          flex-direction: column;
          position: relative;
          background: radial-gradient(circle at 50% 50%, #0d0d0d 0%, #000000 100%);
          color: #f3f4f6;
          font-family: Inter, sans-serif;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wordSlideIn {
          from { transform: translateY(15px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes wordSlideOut {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(-15px); opacity: 0; }
        }
        @keyframes floatContainer {
          0% { transform: perspective(1000px) rotateY(-8deg) rotateX(4deg) translateY(0); }
          100% { transform: perspective(1000px) rotateY(-8deg) rotateX(4deg) translateY(-8px); }
        }
        @keyframes pulseGlow {
          0% { transform: scale(1); opacity: 0.1; }
          100% { transform: scale(1.1); opacity: 0.15; }
        }
        .animate-fade {
          animation: fadeIn 1s ease-out forwards;
        }
        .animate-slide-up-1 {
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-up-2 {
          opacity: 0;
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards;
        }
        .animate-slide-up-3 {
          opacity: 0;
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
        }
        .animate-slide-up-4 {
          opacity: 0;
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.45s forwards;
        }
        .word-slide-in {
          display: inline-block;
          animation: wordSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .word-slide-out {
          display: inline-block;
          animation: wordSlideOut 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .float-mockup {
          animation: floatContainer 4s ease-in-out infinite alternate;
        }
        .pulse-orb {
          animation: pulseGlow 6s ease-in-out infinite alternate;
        }
        
        /* Layout Grid */
        .hero-section-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 48px;
          align-items: center;
          padding: 0 48px;
          flex: 1;
        }
        
        /* Mobile & Tablet Responsiveness */
        @media (max-width: 991px) {
          .landing-container {
            height: auto !important;
            min-height: 100vh;
            overflow: auto !important;
          }
          .hero-section-grid {
            grid-template-columns: 1fr;
            padding: 40px 24px;
            text-align: center;
            justify-content: center;
            align-content: center;
            gap: 32px;
          }
          .mockup-column {
            display: flex;
            justify-content: center;
            width: 100%;
            max-width: 420px;
            margin: 0 auto;
          }
          .hero-title {
            font-size: 38px !important;
          }
          .hero-subtitle {
            margin: 0 auto !important;
            font-size: 15px !important;
          }
          .hero-buttons {
            justify-content: center;
          }
          .landing-nav {
            padding: 16px 24px !important;
          }
          .landing-footer {
            padding: 24px 24px !important;
          }
        }
        @media (max-width: 480px) {
          .hero-title {
            font-size: 32px !important;
          }
          .hero-buttons {
            flex-direction: column;
            width: 100%;
            gap: 12px !important;
          }
          .landing-btn-custom {
            width: 100%;
            text-align: center;
            justify-content: center;
          }
        }
      `}} />

      {/* Floating Glowing Orbs (Silver/Grey Glow) */}
      <div className="glowing-orb pulse-orb" style={{ width: '450px', height: '450px', top: '5%', left: '10%', zIndex: 3, backgroundColor: 'rgba(255, 255, 255, 0.02)', filter: 'blur(120px)' }}></div>
      <div className="glowing-orb pulse-orb" style={{ width: '400px', height: '400px', bottom: '10%', right: '15%', zIndex: 3, backgroundColor: 'rgba(255, 255, 255, 0.01)', filter: 'blur(100px)' }}></div>

      {/* Premium Workspace Background Image */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'url("/landing_background.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.25,
        filter: 'grayscale(20%) brightness(0.9)',
        zIndex: 1,
        pointerEvents: 'none'
      }} />

      {/* Cyber-Tech Grid Lines Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.012) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        zIndex: 2,
        pointerEvents: 'none'
      }} />

      {/* Transparent Header */}
      <header className="landing-nav" style={{ zIndex: 10, padding: '24px 48px', borderBottom: 'none', backgroundColor: 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <Link to="/" className="landing-nav-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckSquare size={26} color="#ffffff" />
          <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', color: '#ffffff' }}>MissionChecked</span>
        </Link>
        <div className="landing-nav-actions" style={{ display: 'flex', gap: '14px' }}>
          <Link to="/login" style={{ 
            padding: '10px 20px', 
            fontSize: '14px', 
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            backgroundColor: 'transparent',
            color: '#ffffff',
            textDecoration: 'none',
            fontWeight: 500,
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}>
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="hero-section-grid" style={{ zIndex: 5 }}>
        
        {/* Left Column: Heading & CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', justifyContent: 'center' }}>
          {/* Silver/Black Badge */}
          <div className="animate-slide-up-1" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#d4d4d8',
            alignSelf: 'flex-start',
            margin: '0 auto 0 0'
          }}>
            <Sparkles size={14} color="#ffffff" />
            Introducing MissionChecked 2.0
          </div>

          {/* Heading with looping animation text (Silver Gradient) */}
          <h1 className="hero-title animate-slide-up-2" style={{ 
            fontSize: '52px', 
            fontWeight: 800, 
            lineHeight: 1.15,
            letterSpacing: '-1.5px',
            margin: 0,
            color: '#ffffff'
          }}>
            Organize work.<br />
            Automate your{' '}
            <span className={`gradient-text ${animationClass}`} style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #a5f3fc 30%, #c084fc 65%, #f472b6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 800,
              filter: 'drop-shadow(0 0 12px rgba(192, 132, 252, 0.45))'
            }}>
              {words[wordIndex]}.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle animate-slide-up-3" style={{ 
            fontSize: '16px', 
            color: '#9ca3af', 
            lineHeight: 1.6, 
            maxWidth: '560px',
            margin: 0
          }}>
            MissionChecked is a minimalist daily task manager featuring interactive glassmorphic Kanban boards and automated email summaries to keep you productive.
          </p>

          {/* Actions */}
          <div className="hero-buttons animate-slide-up-4" style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
            <Link to="/register" className="landing-btn-custom" style={{ 
              padding: '14px 28px', 
              fontSize: '15px', 
              borderRadius: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              fontWeight: 600,
              backgroundColor: '#ffffff',
              color: '#000000',
              textDecoration: 'none',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#e4e4e7'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#ffffff'}>
              Get Started Free <ArrowRight size={18} />
            </Link>
            
            <Link to="/login" className="landing-btn-custom" style={{ 
              padding: '14px 28px', 
              fontSize: '15px', 
              borderRadius: '10px', 
              fontWeight: 500,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'transparent',
              color: '#ffffff',
              textDecoration: 'none',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}>
              Sign In
            </Link>
          </div>
        </div>

        {/* Right Column: Visual Dashboard Mockup (Black & Silver theme) */}
        <div className="mockup-column animate-fade" style={{ 
          position: 'relative', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          perspective: '1200px'
        }}>
          <div className="glass-container float-mockup" style={{ 
            width: '100%', 
            gap: '16px', 
            padding: '24px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.7)',
            transformStyle: 'preserve-3d',
            backgroundColor: 'rgba(255, 255, 255, 0.01)',
            backdropFilter: 'blur(30px)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Columns list */}
            <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', transform: 'translateZ(20px)', border: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '8px' }}>
                <span className="status-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#e4e4e7' }}></span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#e4e4e7' }}>To Do</span>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: '#ffffff' }}>Launch Campaign</div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>Publish product link on socials</div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', transform: 'translateZ(40px)', border: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '8px' }}>
                <span className="status-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#a1a1aa' }}></span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#a1a1aa' }}>In Progress</span>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: '#ffffff' }}>Analytics Logging</div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>Tracking visits on missionchecked.com</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="landing-footer" style={{ 
        zIndex: 10, 
        padding: '16px 48px', 
        borderTop: '1px solid rgba(255,255,255,0.03)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
          &copy; {new Date().getFullYear()} MissionChecked Inc. All rights reserved. |{' '}
          <Link to="#" style={{ color: '#6b7280', textDecoration: 'none' }}>Privacy Policy</Link> |{' '}
          <Link to="#" style={{ color: '#6b7280', textDecoration: 'none' }}>Terms of Service</Link>
        </p>
      </footer>
    </div>
  );
}
