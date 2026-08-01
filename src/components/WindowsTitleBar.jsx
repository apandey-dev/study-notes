import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Download, 
  Sun, 
  Moon, 
  Settings, 
  Minus, 
  Square, 
  Copy, 
  X 
} from 'lucide-react';

export default function WindowsTitleBar({
  screen,
  theme,
  onToggleTheme,
  onToggleSearch,
  onOpenExport,
  onOpenSettings
}) {
  const [isMaximized, setIsMaximized] = useState(false);
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  const handleDoubleClick = () => {
    if (isElectron) {
      window.electronAPI.maximizeWindow();
      window.electronAPI.isMaximized().then(res => setIsMaximized(res));
    }
  };

  const handleMinimize = () => {
    if (isElectron) window.electronAPI.minimizeWindow();
  };

  const handleMaximize = () => {
    if (isElectron) {
      window.electronAPI.maximizeWindow();
      window.electronAPI.isMaximized().then(res => setIsMaximized(res));
    }
  };

  const handleClose = () => {
    if (isElectron) window.electronAPI.closeWindow();
  };

  return (
    <div className="windows-titlebar" onDoubleClick={handleDoubleClick}>
      {/* LEFT: App Logo & Title (Drag Region) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <BookOpen size={16} color="#0078D4" />
        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>Study Notes</span>
      </div>

      {/* RIGHT: Compact Application Actions & Native Windows Window Controls */}
      <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* Editor Actions only visible when in editor mode */}
        {screen === 'editor' && (
          <>
            <button className="btn-titlebar-icon" onClick={onToggleSearch} title="Find & Replace (Ctrl+F)">
              <Search size={14} />
            </button>

            <button className="btn-titlebar-icon" onClick={onOpenExport} title="Export as PDF / PNG">
              <Download size={14} />
            </button>
          </>
        )}

        {/* Global Theme Toggle */}
        <button 
          className="btn-titlebar-icon" 
          onClick={onToggleTheme} 
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={14} color="#FBBF24" /> : <Moon size={14} color="#0078D4" />}
        </button>

        {/* Settings */}
        <button className="btn-titlebar-icon" onClick={onOpenSettings} title="Settings">
          <Settings size={14} />
        </button>

        {/* Native Windows Controls */}
        {isElectron && (
          <>
            <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', margin: '0 4px' }} />
            <button className="win-control-btn" onClick={handleMinimize} title="Minimize">
              <Minus size={13} />
            </button>

            <button className="win-control-btn" onClick={handleMaximize} title={isMaximized ? "Restore Down" : "Maximize"}>
              {isMaximized ? <Copy size={12} /> : <Square size={12} />}
            </button>

            <button className="win-control-btn close-btn" onClick={handleClose} title="Close">
              <X size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
