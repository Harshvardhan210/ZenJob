import React from 'react';
import { Sparkles, FileText, FileSpreadsheet, Camera, CheckCircle2, ChevronRight, Briefcase, Sun, Moon } from 'lucide-react';

function LandingPage({ onGetStarted, theme, setTheme }) {
  return (
    <div className="app-wrapper welcome-screen" style={{ flexDirection: 'column', minHeight: '100vh', backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.12) 0%, transparent 70%)', position: 'relative', overflowX: 'hidden', background: 'var(--body-bg)' }}>

      {/* Navbar/Header */}
      <header style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '1400px', margin: '0 auto', zIndex: 10 }}>
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '800', fontSize: '1.5rem', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          <Briefcase size={28} style={{ color: '#818cf8' }} />
          ZenJob
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {setTheme && (
            <button
              className="btn btn-secondary btn-icon-only"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{ borderRadius: '50%', padding: '0.6rem' }}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={18} style={{ color: '#fcd34d' }} /> : <Moon size={18} style={{ color: '#8b5cf6' }} />}
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={onGetStarted}
            style={{ borderRadius: '99px', padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center', zIndex: 10, maxWidth: '1200px', margin: '0 auto' }}>

        <div className="fade-in" style={{ animationDelay: '0.1s' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '0.5rem 1rem', borderRadius: '99px', color: '#a5b4fc', fontSize: '0.85rem', fontWeight: '600', marginBottom: '2rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            <Sparkles size={14} /> AI-Powered Job Hunting
          </div>
        </div>

        <h1 className="fade-in" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: '800', lineHeight: '1.1', marginBottom: '1.5rem', textShadow: '0 0 40px rgba(99, 102, 241, 0.3)', letterSpacing: '-0.02em', animationDelay: '0.2s' }}>
          Supercharge Your <br />
          <span style={{ background: 'linear-gradient(135deg, #818cf8 0%, #d8b4fe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Career Trajectory</span>
        </h1>

        <p className="fade-in" style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'var(--text-secondary)', maxWidth: '700px', marginBottom: '3rem', lineHeight: '1.6', animationDelay: '0.3s' }}>
          Extract data from any job poster instantly with Gemini AI. Match your resume against live requirements, track applications, and export stunning executive reports.
        </p>

        <div className="fade-in" style={{ animationDelay: '0.4s', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={onGetStarted}
            style={{ padding: '1rem 2rem', fontSize: '1.1rem', borderRadius: '12px', boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4)' }}
          >
            Initiate Uplink <ChevronRight size={20} />
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '6rem', width: '100%', animationDelay: '0.6s' }}>

          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>Multimodal Extraction</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Upload screenshots of job posters. Our AI instantly structures the company, role, skills, and requirements into clean data.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>Live Resume Matching</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Cross-reference your active resume against job listings in real-time. Get instant match scores and skill gap analyses.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(217, 70, 239, 0.15)', color: '#e879f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileSpreadsheet size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>Engineered Reports</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Track applications dynamically and export stunning, color-coded Excel sheets complete with drop-down validations.
            </p>
          </div>

        </div>
      </main>

      {/* Decorative Background Elements */}
      <div style={{ position: 'absolute', top: '10%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 60%)', filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 60%)', filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none' }}></div>
    </div>
  );
}

export default LandingPage;
