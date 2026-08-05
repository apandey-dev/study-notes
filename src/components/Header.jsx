import React from 'react';
import appLogo from '../assets/app-logo.svg';
import { 
  BookOpen, 
  ArrowLeft, 
  Search, 
  Download, 
  Settings, 
  CheckCircle2,
  FileText,
  Grid,
  Sun,
  Moon
} from 'lucide-react';

export default function Header({
  fileName,
  noteType,
  theme,
  onToggleTheme,
  isAutosaved,
  onGoHome,
  onSave,
  onToggleSearch,
  onOpenExport,
  onOpenSettings
}) {
  return (
    <header className="editor-header">
      {/* LEFT: Home Nav, App Title, Page Type Badge, Saved Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button 
          className="btn-compact" 
          onClick={onGoHome} 
          title="Back to Home Screen"
          style={{ padding: '0 10px', height: 32 }}
        >
          <ArrowLeft size={15} />
          <span style={{ fontSize: 13 }}>Home</span>
        </button>

        <div style={{ width: 1, height: 16, background: 'var(--border-subtle)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={appLogo} alt="Study Notes" style={{ width: 20, height: 20, borderRadius: 5 }} />
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
            Study Notes — {fileName || 'Untitled.md'}
          </span>
          
          <span 
            style={{ 
              fontSize: 11, 
              color: 'var(--text-secondary)', 
              background: 'var(--border-light)', 
              padding: '2px 8px', 
              borderRadius: 99,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            {noteType === 'ruled' ? <FileText size={11} color="#0078D4" /> : <Grid size={11} color="#0078D4" />}
            {noteType === 'ruled' ? 'Ruled' : 'Blank'}
          </span>

          <span style={{ fontSize: 11, color: isAutosaved ? '#10B981' : '#3B82F6', display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={12} />
            {isAutosaved ? 'Saved' : 'Saving...'}
          </span>
        </div>
      </div>

      {/* RIGHT: Find, Export, Theme Toggle, Settings (NO WINDOW CONTROLS HERE!) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="btn-compact" onClick={onToggleSearch} title="Find & Replace (Ctrl+F)">
          <Search size={14} />
          <span style={{ fontSize: 12 }}>Find</span>
        </button>

        <button className="btn-compact" onClick={onOpenExport} title="Export as PDF / PNG">
          <Download size={14} />
          <span style={{ fontSize: 12 }}>Export</span>
        </button>

        <button 
          className="btn-compact" 
          onClick={onToggleTheme} 
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={14} color="#FBBF24" /> : <Moon size={14} color="#0078D4" />}
        </button>

        <button className="btn-compact" onClick={onOpenSettings} title="Settings" style={{ width: 34, padding: 0 }}>
          <Settings size={15} />
        </button>
      </div>
    </header>
  );
}
