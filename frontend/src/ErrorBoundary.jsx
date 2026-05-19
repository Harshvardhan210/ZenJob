import React from 'react';
import { AlertTriangle, RefreshCw, Terminal } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div className="app-wrapper" style={{ justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '2rem' }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', border: '1px solid rgba(239, 68, 68, 0.3)', boxShadow: '0 0 30px rgba(239, 68, 68, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', color: '#f87171' }}>
              <div className="icon-box" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                <AlertTriangle size={28} />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>System Exception</h2>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              A critical error occurred in the application runtime. The process has been safely halted to prevent data corruption.
            </p>

            <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid var(--border-glass)', overflowX: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#818cf8', fontSize: '0.85rem' }}>
                <Terminal size={14} />
                <span>Error Log</span>
              </div>
              <pre style={{ color: '#f87171', fontSize: '0.85rem', margin: 0, whiteSpace: 'pre-wrap' }}>
                {this.state.error && this.state.error.toString()}
              </pre>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', border: 'none' }}
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={18} />
              Reboot System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
