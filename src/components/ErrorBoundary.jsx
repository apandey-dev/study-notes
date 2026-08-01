import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CRITICAL UNCAUGHT ERROR CATCHED BY BOUNDARY:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div 
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw',
            background: 'var(--bg-app, #FAFAFA)',
            color: 'var(--text-primary, #1F2937)',
            padding: 30,
            textAlign: 'center',
            boxSizing: 'border-box'
          }}
        >
          <div 
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: '#FEE2E2',
              border: '1px solid #FCA5A5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              color: '#DC2626'
            }}
          >
            <AlertTriangle size={32} />
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0' }}>
            Application Error Recovered
          </h1>

          <p style={{ fontSize: 14, color: 'var(--text-muted, #6B7280)', maxWidth: 460, marginBottom: 20 }}>
            An unexpected error occurred. The application recovered safely. Click below to return to the Home Screen.
          </p>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, fontSize: 12, color: '#EF4444', fontFamily: 'monospace', maxWidth: 600, overflowX: 'auto', marginBottom: 24 }}>
            {this.state.error && this.state.error.toString()}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              className="btn-compact-primary"
              onClick={this.handleReset}
            >
              <Home size={16} />
              <span>Return to Home Screen</span>
            </button>

            <button 
              className="btn-compact"
              style={{ height: 40, padding: '0 18px', border: '1px solid var(--border-subtle)' }}
              onClick={this.handleReload}
            >
              <RefreshCw size={16} />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
