import React from 'react';
import { X, Settings, Keyboard, Sun, Moon } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, theme, onToggleTheme }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={18} color="#0078D4" />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Study Notebook Settings</h2>
          </div>
          <button className="btn-compact" style={{ width: 28, height: 28, padding: 0 }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Theme Preference */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Appearance Theme
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              className={`btn-compact ${theme === 'light' ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center', height: 36 }}
              onClick={() => theme !== 'light' && onToggleTheme()}
            >
              <Sun size={15} color="#D97706" />
              <span>Light Mode</span>
            </button>

            <button 
              className={`btn-compact ${theme === 'dark' ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center', height: 36 }}
              onClick={() => theme !== 'dark' && onToggleTheme()}
            >
              <Moon size={15} color="#60A5FA" />
              <span>Dark Mode</span>
            </button>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
            <Keyboard size={14} />
            <span>Keyboard Shortcuts</span>
          </label>

          <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 12, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Create New Note</span>
              <kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>Ctrl + N</kbd>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Open Note File</span>
              <kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>Ctrl + O</kbd>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Save Content</span>
              <kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>Ctrl + S</kbd>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Find Text</span>
              <kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>Ctrl + F</kbd>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Replace Text</span>
              <kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>Ctrl + H</kbd>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Typography System
          </label>
          <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 10, fontSize: 12 }}>
            <div style={{ fontFamily: 'Playpen Sans, cursive, sans-serif', color: 'var(--text-primary)' }}>Body Text: Playpen Sans (18px)</div>
            <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>Headings: Fredoka (34px, 28px, 24px, 20px)</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn-compact-primary" onClick={onClose} style={{ height: 32, padding: '0 16px', fontSize: 13 }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
