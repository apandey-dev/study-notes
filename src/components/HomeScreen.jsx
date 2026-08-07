import React, { useState, useEffect, useRef } from 'react';
import appLogo from '../assets/app-logo.svg';
import { 
  Plus, 
  FolderOpen, 
  FileText, 
  Search, 
  BookOpen, 
  FileCode, 
  Clock, 
  Folder,
  Trash2,
  Edit3,
  AlertCircle,
  Sun,
  Moon,
  Pin
} from 'lucide-react';

export default function HomeScreen({ 
  recentNotes, 
  theme,
  onToggleTheme,
  onCreateNote, 
  onOpenNote, 
  onSelectRecentNote, 
  onRenameRecentNote,
  onRemoveRecentNote,
  onDropFile,
  pinnedPaths = [],
  onTogglePinNote
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedNotePath, setSelectedNotePath] = useState(null);
  const contextMenuRef = useRef(null);

  // Auto-close context menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onDropFile(files[0]);
    }
  };

  const notesList = Array.isArray(recentNotes) ? recentNotes : [];

  const filteredNotes = notesList.filter(n => {
    if (!n) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = (n.fileName || '').toLowerCase().includes(q);
    const extMatch = (n.fileFormat || '').toLowerCase().includes(q);
    const folderMatch = (n.folderPath || '').toLowerCase().includes(q);
    return nameMatch || extMatch || folderMatch;
  });

  const handleRightClick = (e, note) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      note
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return 'Recent';
    try {
      const date = new Date(isoString);
      const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
      if (diffMin < 2) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch (e) {
      return 'Recent';
    }
  };

  return (
    <div 
      className="home-screen-layout"
      onClick={closeContextMenu}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* FULL-WIDTH FIXED HEADER (Height: 64px) */}
      <header className="home-header">
        {/* LEFT: App Logo, Title, Subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="home-logo-box" style={{ width: 44, height: 44, borderRadius: 14, marginBottom: 0, padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={appLogo} alt="Study Notes" style={{ width: 34, height: 34 }} />
          </div>
          <div>
            <h1 className="home-title" style={{ fontSize: 20, margin: 0, textAlign: 'left', lineHeight: 1.1 }}>
              Study Notes
            </h1>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Simple Markdown & Text Notebook</span>
          </div>
        </div>

        {/* CENTER: Search Box */}
        <div className="header-search-container">
          <Search size={14} color="var(--text-muted)" style={{ marginRight: 8 }} />
          <input 
            type="text" 
            placeholder="Search notes, extensions, folders..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 13,
              fontFamily: 'Fredoka, sans-serif',
              color: 'var(--text-primary)',
              width: '100%'
            }}
          />
        </div>

        {/* RIGHT: Rebalanced Header Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Segmented Theme Toggle */}
          <div 
            style={{ 
              display: 'flex', 
              background: 'var(--border-light)', 
              borderRadius: 8, 
              padding: 2, 
              border: '1px solid var(--border-subtle)' 
            }}
          >
            <button 
              className={`btn-compact ${theme === 'light' ? 'active' : ''}`}
              style={{ height: 30, padding: '0 10px', borderRadius: 6, fontSize: 12 }}
              onClick={() => theme !== 'light' && onToggleTheme()}
              title="Light Mode"
            >
              <Sun size={13} color={theme === 'light' ? '#0078D4' : 'var(--text-muted)'} />
              <span>Light</span>
            </button>
            <button 
              className={`btn-compact ${theme === 'dark' ? 'active' : ''}`}
              style={{ height: 30, padding: '0 10px', borderRadius: 6, fontSize: 12 }}
              onClick={() => theme !== 'dark' && onToggleTheme()}
              title="Dark Mode"
            >
              <Moon size={13} color={theme === 'dark' ? '#0078D4' : 'var(--text-muted)'} />
              <span>Dark</span>
            </button>
          </div>

          {/* Open Note Button */}
          <button 
            className="btn-compact" 
            onClick={onOpenNote}
            title="Open Note File from Disk"
          >
            <FolderOpen size={15} color="#0078D4" />
            <span>Open Note</span>
          </button>

          {/* Create Note Button */}
          <button 
            className="btn-compact-primary" 
            onClick={onCreateNote}
            title="Create New Note"
          >
            <Plus size={15} />
            <span>New Note</span>
          </button>
        </div>
      </header>

      {/* SCROLLABLE NOTES GRID CONTAINER */}
      <div className="notes-grid-container">
        <div className="notes-grid">
          {/* CARD 1: + Create New Note */}
          <div 
            className="note-card"
            onClick={onCreateNote}
            style={{
              border: '2px dashed var(--accent)',
              background: 'var(--accent-light)',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
              textAlign: 'center'
            }}
          >
            <div 
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--accent)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6
              }}
            >
              <Plus size={20} />
            </div>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Create New Note</span>
            <span style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>Save directly to disk</span>
          </div>

          {/* RECENT NOTE CARDS */}
          {filteredNotes.map((note) => {
            if (!note) return null;
            const isSelected = selectedNotePath === note.filePath;
            const isMissing = note.isMissing === true;
            const displayFileName = note.fileName || 'Untitled.md';

            return (
              <div 
                key={note.filePath || note.fileName}
                className="note-card"
                onClick={() => setSelectedNotePath(note.filePath)}
                onDoubleClick={() => onSelectRecentNote(note)}
                onContextMenu={(e) => handleRightClick(e, note)}
                style={{
                  background: isSelected ? 'var(--accent-light)' : 'var(--bg-card)',
                  borderColor: isMissing ? '#FCA5A5' : isSelected ? 'var(--accent)' : 'var(--border-subtle)',
                  opacity: isMissing ? 0.75 : 1
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {note.fileFormat === 'md' ? (
                        <FileCode size={16} color={isMissing ? '#EF4444' : '#0078D4'} />
                      ) : (
                        <FileText size={16} color={isMissing ? '#EF4444' : '#0078D4'} />
                      )}
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {note.fileFormat === 'txt' ? 'Text (.txt)' : 'Markdown (.md)'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {pinnedPaths.includes(note.filePath) && (
                        <Pin size={11} fill="var(--accent)" stroke="var(--accent)" style={{ transform: 'rotate(45deg)' }} />
                      )}
                      {isMissing ? (
                        <span 
                          style={{
                            fontSize: 10,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: '#FEE2E2',
                            color: '#DC2626',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3
                          }}
                        >
                          <AlertCircle size={10} />
                          Missing File
                        </span>
                      ) : (
                        <span 
                          style={{
                            fontSize: 10,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: 'var(--border-light)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {note.pageType === 'ruled' ? 'Ruled' : 'Blank'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div 
                    style={{ 
                      fontSize: 14, 
                      fontWeight: 700, 
                      color: isMissing ? '#EF4444' : 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title={displayFileName}
                  >
                    {displayFileName}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                    <Folder size={11} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                      {note.folderPath || 'Documents'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)' }}>
                    <Clock size={10} />
                    <span>{formatRelativeTime(note.lastModified)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredNotes.length === 0 && (
          <div style={{ marginTop: 60, textAlign: 'center', width: '100%' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--accent-light)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <BookOpen size={28} color="#0078D4" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>No Notes Found</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Create a new note or open an existing file</p>
            <button className="btn-compact-primary" onClick={onCreateNote}>
              <Plus size={16} />
              <span>Create Your First Note</span>
            </button>
          </div>
        )}
      </div>

      {/* AUTO-CLOSING CONTEXT MENU */}
      {contextMenu && (
        <div 
          ref={contextMenuRef}
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            padding: 4,
            zIndex: 300,
            width: 170,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className="btn-compact" 
            style={{ justifyContent: 'flex-start', width: '100%', height: 30 }}
            onClick={() => { onSelectRecentNote(contextMenu.note); closeContextMenu(); }}
          >
            <FolderOpen size={13} color="#0078D4" />
            <span>Open</span>
          </button>
          
          <button 
            className="btn-compact" 
            style={{ justifyContent: 'flex-start', width: '100%', height: 30 }}
            onClick={() => { onTogglePinNote(contextMenu.note); closeContextMenu(); }}
          >
            <Pin size={13} fill={pinnedPaths.includes(contextMenu.note.filePath) ? "var(--accent)" : "none"} color="var(--accent)" style={{ transform: 'rotate(45deg)' }} />
            <span>{pinnedPaths.includes(contextMenu.note.filePath) ? 'Unpin from Top' : 'Pin to Top'}</span>
          </button>

          <button 
            className="btn-compact" 
            style={{ justifyContent: 'flex-start', width: '100%', height: 30 }}
            onClick={() => {
              const newName = prompt('Rename file on disk:', contextMenu.note.fileName);
              if (newName && newName.trim()) {
                onRenameRecentNote(contextMenu.note, newName.trim());
              }
              closeContextMenu();
            }}
          >
            <Edit3 size={13} />
            <span>Rename File</span>
          </button>

          <button 
            className="btn-compact" 
            style={{ justifyContent: 'flex-start', width: '100%', height: 30, color: '#EF4444' }}
            onClick={() => {
              onRemoveRecentNote(contextMenu.note.filePath || contextMenu.note.fileName);
              closeContextMenu();
            }}
          >
            <Trash2 size={13} />
            <span>Remove from Recent</span>
          </button>
        </div>
      )}
    </div>
  );
}
