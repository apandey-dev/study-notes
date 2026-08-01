import React, { useState, useEffect, useRef, useCallback } from 'react';
import HomeScreen from './components/HomeScreen';
import EditorCanvas from './components/EditorCanvas';
import SearchOverlay from './components/SearchOverlay';
import ExportModal from './components/ExportModal';
import { parseFileContent, serializeFileContent } from './utils/markdownConverter';
import { 
  Sun, 
  Moon, 
  ArrowLeft, 
  Save, 
  Download, 
  Maximize2, 
  Minimize2,
  FolderOpen,
  Plus,
  Minus,
  Grid,
  FileText,
  X
} from 'lucide-react';

const SESSION_STORAGE_KEY = 'fluent_notes_active_session';
const THEME_STORAGE_KEY = 'fluent_notes_theme';

export default function App() {
  // Application Screen State: 'home' | 'editor'
  const [screen, setScreen] = useState('home');

  // SYNCHRONOUS INITIALIZATION OF THEME (Prevents theme flickering / resetting after Force Reload)
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', savedTheme);
      return savedTheme;
    }
    return 'light';
  });

  // Active File & Document State
  const [activeFile, setActiveFile] = useState(null); // { name, path, format }
  const [editorContent, setEditorContent] = useState('');
  const [floatingObjects, setFloatingObjects] = useState([]);
  const [noteType, setNoteType] = useState('ruled'); // 'ruled' | 'blank'

  // Recent Notes List
  const [recentNotes, setRecentNotes] = useState([]);

  // Editor Viewport States
  const [zoom, setZoom] = useState(100);
  const [wordWrap, setWordWrap] = useState(true);
  const [pageSize, setPageSize] = useState('A4');
  const [customWidth, setCustomWidth] = useState(800);
  const [customHeight, setCustomHeight] = useState(1100);

  // Modals & Panels
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const paperRef = useRef(null);
  const editorInstanceRef = useRef(null);

  const handleSetEditorInstance = useCallback((inst) => {
    editorInstanceRef.current = inst;
  }, []);

  // PERSIST THEME IMMEDIATELY WHEN TOGGLED
  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    if (window.electronAPI && window.electronAPI.saveAppConfig) {
      window.electronAPI.saveAppConfig({ theme: nextTheme });
    }
  };

  // RESTORE ACTIVE SESSION & CONFIG ON MOUNT / RELOAD
  useEffect(() => {
    // 1. Check Electron AppConfig for saved theme if available
    if (window.electronAPI && window.electronAPI.getAppConfig) {
      window.electronAPI.getAppConfig().then(cfg => {
        if (cfg && cfg.theme) {
          setTheme(cfg.theme);
          document.documentElement.setAttribute('data-theme', cfg.theme);
          localStorage.setItem(THEME_STORAGE_KEY, cfg.theme);
        }
      });
    }

    // 2. Restore active editor session if reloading during an edit session
    const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        if (session && session.screen === 'editor' && session.activeFile) {
          // If file path exists, re-read latest content directly from disk!
          if (session.activeFile.path && window.electronAPI) {
            window.electronAPI.readFileContent({ filePath: session.activeFile.path }).then(res => {
              if (res && res.success) {
                const parsed = parseFileContent(res.content, session.activeFile.format);
                setActiveFile(session.activeFile);
                setEditorContent(parsed.html);
                setFloatingObjects(parsed.floatingObjects);
                setNoteType(session.noteType || 'ruled');
                setZoom(session.zoom || 100);
                setScreen('editor');
              } else {
                // Fallback to session cache if file read fails
                setActiveFile(session.activeFile);
                setEditorContent(session.content || '');
                setFloatingObjects(session.floatingObjects || []);
                setNoteType(session.noteType || 'ruled');
                setZoom(session.zoom || 100);
                setScreen('editor');
              }
            });
          } else {
            setActiveFile(session.activeFile);
            setEditorContent(session.content || '');
            setFloatingObjects(session.floatingObjects || []);
            setNoteType(session.noteType || 'ruled');
            setZoom(session.zoom || 100);
            setScreen('editor');
          }

          // Restore scroll position after canvas render
          setTimeout(() => {
            if (session.scrollTop && paperRef.current) {
              const viewport = paperRef.current.closest('.editor-main-viewport');
              if (viewport) viewport.scrollTop = session.scrollTop;
            }
          }, 150);
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
      }
    }

    // Load workspace notes list
    if (window.electronAPI && window.electronAPI.getWorkspaceFiles) {
      window.electronAPI.getWorkspaceFiles().then((res) => {
        if (res && res.success && res.files) {
          setRecentNotes(res.files);
        }
      });
    }
  }, []);

  // AUTOMATICALLY PERSIST SESSION WHEN EDITOR STATE CHANGES
  useEffect(() => {
    if (screen === 'editor' && activeFile) {
      const viewport = paperRef.current ? paperRef.current.closest('.editor-main-viewport') : null;
      const sessionData = {
        screen: 'editor',
        activeFile,
        noteType,
        content: editorContent,
        floatingObjects,
        zoom,
        scrollTop: viewport ? viewport.scrollTop : 0
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    }
  }, [screen, activeFile, noteType, editorContent, floatingObjects, zoom]);

  // FLUSH AUTOSAVE & SESSION BEFORE RELOAD / UNLOAD
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (screen === 'editor' && activeFile) {
        const viewport = paperRef.current ? paperRef.current.closest('.editor-main-viewport') : null;
        const sessionData = {
          screen: 'editor',
          activeFile,
          noteType,
          content: editorContent,
          floatingObjects,
          zoom,
          scrollTop: viewport ? viewport.scrollTop : 0
        };
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
        handleSaveFile();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [screen, activeFile, noteType, editorContent, floatingObjects, zoom]);

  // OPEN A NOTE FILE DIRECTLY FROM DISK (Fixes empty editor bug)
  const handleOpenNote = async (fileObj) => {
    let targetPath = fileObj ? (fileObj.filePath || fileObj.path) : null;
    let targetName = fileObj ? (fileObj.fileName || fileObj.name) : null;
    let rawContent = fileObj ? (fileObj.content || '') : '';

    // If no path provided or user clicked "Open Note", show native open file dialog
    if (!targetPath && window.electronAPI) {
      const openRes = await window.electronAPI.openFileDialog();
      if (openRes && openRes.success && openRes.filePath) {
        targetPath = openRes.filePath;
        targetName = openRes.fileName;
        rawContent = openRes.content;
      } else {
        return; // User canceled dialog
      }
    }

    // Re-read fresh content directly from disk if path exists
    if (targetPath && window.electronAPI) {
      const readRes = await window.electronAPI.readFileContent({ filePath: targetPath });
      if (readRes && readRes.success) {
        rawContent = readRes.content;
      }
    }

    const name = targetName || 'Untitled.md';
    const ext = name.split('.').pop().toLowerCase();
    const format = ext === 'txt' ? 'txt' : 'md';

    // Parse Markdown/Text and extract floating objects
    const parsed = parseFileContent(rawContent, format);

    setActiveFile({
      name,
      path: targetPath || null,
      format
    });

    setEditorContent(parsed.html);
    setFloatingObjects(parsed.floatingObjects || []);
    setScreen('editor');
  };

  // Create New Note
  const handleCreateNewNote = (format = 'md') => {
    const defaultName = `Untitled Note ${Date.now().toString().slice(-4)}.${format}`;
    setActiveFile({
      name: defaultName,
      path: null,
      format
    });
    setEditorContent('<p></p>');
    setFloatingObjects([]);
    setScreen('editor');
  };

  // Save File Content Directly to Disk
  const handleSaveFile = async () => {
    if (!activeFile) return;

    const serializedData = serializeFileContent(editorContent, activeFile.format, floatingObjects);

    if (window.electronAPI && activeFile.path) {
      await window.electronAPI.saveFileContent({
        filePath: activeFile.path,
        content: serializedData
      });
    } else if (window.electronAPI) {
      const createRes = await window.electronAPI.createFileDialog({
        defaultName: activeFile.name,
        extension: activeFile.format
      });
      if (createRes.success && createRes.filePath) {
        await window.electronAPI.saveFileContent({
          filePath: createRes.filePath,
          content: serializedData
        });
        setActiveFile({
          ...activeFile,
          name: createRes.filePath.split(/[\\/]/).pop(),
          path: createRes.filePath
        });
      }
    }
  };

  // INTENTIONAL CLOSE NOTE -> Clears session state & returns to Home
  const handleCloseNoteIntentional = () => {
    handleSaveFile();
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setActiveFile(null);
    setScreen('home');
  };

  // Window Controls
  const handleMinimize = () => {
    if (window.electronAPI) window.electronAPI.minimizeWindow();
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.maximizeWindow();
      setIsMaximized(!isMaximized);
    }
  };

  const handleCloseApp = () => {
    if (screen === 'editor' && activeFile) {
      handleSaveFile();
    }
    if (window.electronAPI) window.electronAPI.closeWindow();
  };

  return (
    <div className="app-container">
      {/* SINGLE WINDOWS NATIVE TITLEBAR HEADER */}
      <div className="windows-titlebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {screen === 'editor' ? (
            <button 
              className="btn-titlebar-icon no-drag" 
              onClick={handleCloseNoteIntentional}
              title="Return to Home (ESC)"
            >
              <ArrowLeft size={16} />
            </button>
          ) : (
            <div style={{ width: 8 }} />
          )}

          <span style={{ fontWeight: 600 }}>
            {screen === 'editor' && activeFile 
              ? activeFile.name 
              : 'FluentNotes - Minimalist Study Notebook'}
          </span>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {screen === 'editor' && (
            <>
              {/* Ruled / Blank Toggle */}
              <button 
                className="btn-compact no-drag" 
                style={{ height: 28, fontSize: 12, padding: '0 8px' }}
                onClick={() => setNoteType(noteType === 'ruled' ? 'blank' : 'ruled')}
                title="Toggle Ruled Lines / Blank Page"
              >
                {noteType === 'ruled' ? <Grid size={13} /> : <FileText size={13} />}
                <span>{noteType === 'ruled' ? 'Ruled' : 'Blank'}</span>
              </button>

              {/* Zoom Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'var(--border-light)', borderRadius: 6, padding: '0 4px', height: 28 }} className="no-drag">
                <button className="btn-titlebar-icon" style={{ width: 22, height: 22 }} onClick={() => setZoom(Math.max(50, zoom - 10))}>
                  <Minus size={12} />
                </button>
                <span style={{ fontSize: 11, fontWeight: 600, minWidth: 32, textAlign: 'center' }}>{zoom}%</span>
                <button className="btn-titlebar-icon" style={{ width: 22, height: 22 }} onClick={() => setZoom(Math.min(200, zoom + 10))}>
                  <Plus size={12} />
                </button>
              </div>

              {/* Save Button */}
              <button 
                className="btn-compact no-drag" 
                style={{ height: 28, fontSize: 12, padding: '0 10px' }}
                onClick={handleSaveFile}
                title="Save Note (Ctrl+S)"
              >
                <Save size={13} color="var(--accent)" />
                <span>Save</span>
              </button>

              {/* Export Button */}
              <button 
                className="btn-compact-primary no-drag" 
                style={{ height: 28, fontSize: 12, padding: '0 10px' }}
                onClick={() => setIsExportOpen(true)}
                title="Export PDF / PNG"
              >
                <Download size={13} />
                <span>Export</span>
              </button>
            </>
          )}

          {/* Theme Toggle */}
          <button 
            className="btn-titlebar-icon no-drag" 
            onClick={handleToggleTheme}
            title="Toggle Light / Dark Theme"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* Native Window Controls */}
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: 4 }}>
            <button className="win-control-btn no-drag" onClick={handleMinimize} title="Minimize">
              <Minus size={14} />
            </button>
            <button className="win-control-btn no-drag" onClick={handleMaximize} title="Maximize">
              {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
            <button className="win-control-btn close-btn no-drag" onClick={handleCloseApp} title="Close">
              <X size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* SCREEN ROUTER */}
      {screen === 'home' ? (
        <HomeScreen 
          recentNotes={recentNotes}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onCreateNote={() => handleCreateNewNote('md')}
          onOpenNote={handleOpenNote}
          onSelectRecentNote={(note) => handleOpenNote(note)}
          onRenameRecentNote={async (note, newName) => {
            if (window.electronAPI && note.filePath) {
              const renameRes = await window.electronAPI.renameFile({ oldPath: note.filePath, newName });
              if (renameRes.success) {
                setRecentNotes(recentNotes.map(n => n.filePath === note.filePath ? { ...n, fileName: renameRes.newFileName, filePath: renameRes.newPath } : n));
              }
            }
          }}
          onRemoveRecentNote={async (pathOrName) => {
            if (window.electronAPI) {
              await window.electronAPI.deleteFile({ filePath: pathOrName });
              setRecentNotes(recentNotes.filter(n => n.filePath !== pathOrName && n.fileName !== pathOrName));
            }
          }}
          onDropFile={(file) => handleOpenNote({ name: file.name, path: file.path, content: '' })}
        />
      ) : (
        <EditorCanvas 
          content={editorContent}
          onContentChange={setEditorContent}
          noteType={noteType}
          fileFormat={activeFile?.format || 'md'}
          pageSize={pageSize}
          customWidth={customWidth}
          customHeight={customHeight}
          wordWrap={wordWrap}
          zoom={zoom}
          paperRef={paperRef}
          setEditorInstance={handleSetEditorInstance}
          onOpenSearch={() => setIsSearchOpen(true)}
          floatingObjects={floatingObjects}
          onUpdateFloatingObjects={setFloatingObjects}
          fileKey={activeFile?.path || activeFile?.name || 'default_note'}
        />
      )}

      {/* SEARCH PANEL OVERLAY */}
      <SearchOverlay 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        editor={editorInstanceRef.current}
      />

      {/* EXPORT MODAL OVERLAY */}
      <ExportModal 
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        fileName={activeFile?.name || 'CurrentNote'}
        noteType={noteType}
        pageSize={pageSize}
        paperRef={paperRef}
      />
    </div>
  );
}
