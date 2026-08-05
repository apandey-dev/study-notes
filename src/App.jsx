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
  Plus,
  Minus,
  Grid,
  FileText,
  X,
  Check
} from 'lucide-react';

const SESSION_STORAGE_KEY = 'fluent_notes_active_session';
const THEME_STORAGE_KEY = 'fluent_notes_theme';

export default function App() {
  // Application Screen State: 'home' | 'editor'
  const [screen, setScreen] = useState('home');

  // Theme State
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', savedTheme);
      return savedTheme;
    }
    return 'light';
  });

  // Active File & Document State (path is MANDATORY for activeFile)
  const [activeFile, setActiveFile] = useState(null); // { name, path, format }
  const [editorContent, setEditorContent] = useState('');
  const [floatingObjects, setFloatingObjects] = useState([]);
  const [noteType, setNoteType] = useState('ruled'); // 'ruled' | 'blank'

  // Recent Notes List
  const [recentNotes, setRecentNotes] = useState([]);

  // Editor Viewport States
  const [zoom, setZoom] = useState(100);
  const [wordWrap] = useState(true);
  const [pageSize] = useState('A4');
  const [customWidth] = useState(800);
  const [customHeight] = useState(1100);

  // Modals & Panels
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [saveState, setSaveState] = useState('idle'); // 'idle' | 'saving' | 'saved'

  const paperRef = useRef(null);
  const editorInstanceRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  const handleSetEditorInstance = useCallback((inst) => {
    editorInstanceRef.current = inst;
  }, []);

  // Theme Toggle
  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    if (window.electronAPI && window.electronAPI.saveAppConfig) {
      window.electronAPI.saveAppConfig({ theme: nextTheme });
    }
  };

  // RESTORE SESSION & LOAD WORKSPACE ON MOUNT
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.getAppConfig) {
      window.electronAPI.getAppConfig().then(cfg => {
        if (cfg && cfg.theme) {
          setTheme(cfg.theme);
          document.documentElement.setAttribute('data-theme', cfg.theme);
          localStorage.setItem(THEME_STORAGE_KEY, cfg.theme);
        }
      });
    }

    // Load workspace notes list from disk
    if (window.electronAPI && window.electronAPI.getWorkspaceFiles) {
      window.electronAPI.getWorkspaceFiles().then((res) => {
        if (res && res.success && res.files) {
          setRecentNotes(res.files);
        }
      });
    }

    // Restore active editor session only if physical file exists on disk
    const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        if (session && session.screen === 'editor' && session.activeFile && session.activeFile.path && window.electronAPI) {
          window.electronAPI.checkFileExists({ filePath: session.activeFile.path }).then(checkRes => {
            if (checkRes && checkRes.exists) {
              window.electronAPI.readFileContent({ filePath: session.activeFile.path }).then(res => {
                if (res && res.success) {
                  const parsed = parseFileContent(res.content, session.activeFile.format);
                  setActiveFile(session.activeFile);
                  setEditorContent(parsed.html);
                  setFloatingObjects(parsed.floatingObjects || []);
                  setNoteType(session.noteType || 'ruled');
                  setZoom(session.zoom || 100);
                  setScreen('editor');

                  setTimeout(() => {
                    if (session.scrollTop && paperRef.current) {
                      const viewport = paperRef.current.closest('.editor-main-viewport');
                      if (viewport) viewport.scrollTop = session.scrollTop;
                    }
                  }, 150);
                }
              });
            } else {
              localStorage.removeItem(SESSION_STORAGE_KEY);
            }
          });
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
      }
    }
  }, []);

  // AUTOMATICALLY PERSIST SESSION WHEN EDITOR STATE CHANGES
  useEffect(() => {
    if (screen === 'editor' && activeFile && activeFile.path) {
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

  // DIRECT DISK AUTOSAVE (Flushes changes directly to physical file on disk)
  useEffect(() => {
    if (screen === 'editor' && activeFile && activeFile.path && window.electronAPI) {
      const timer = setTimeout(() => {
        const serializedData = serializeFileContent(editorContent, activeFile.format, floatingObjects);
        window.electronAPI.saveFileContent({
          filePath: activeFile.path,
          content: serializedData
        });
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [editorContent, floatingObjects, activeFile, screen]);

  // MANDATORY NEW NOTE CREATION FLOW (STEP 1 - 6)
  const handleCreateNewNote = async (requestedFormat = 'md') => {
    if (!window.electronAPI) {
      alert('Electron API required to create note files.');
      return;
    }

    try {
      // STEP 1: Open native Windows Save File Dialog
      const dateStr = new Date().toISOString().slice(0, 10);
      const defaultName = `Study_Note_${dateStr}`;
      const createRes = await window.electronAPI.createFileDialog({
        defaultName,
        extension: requestedFormat
      });

      // User canceled dialog -> Stop immediately. Do NOT open editor.
      if (!createRes || !createRes.success || !createRes.filePath) {
        return;
      }

      const filePath = createRes.filePath;
      const fileName = createRes.fileName || filePath.split(/[\\/]/).pop();
      const fileFormat = createRes.fileFormat || requestedFormat;

      // STEP 2: Verify physical file exists on disk
      const existRes = await window.electronAPI.checkFileExists({ filePath });
      if (!existRes || !existRes.exists) {
        alert(`File Creation Error: Physical file could not be created or verified at:\n${filePath}`);
        return;
      }

      // STEP 3: Register newly created file in workspace/database
      const newNoteEntry = {
        fileName,
        filePath,
        fileFormat,
        folderPath: 'Documents',
        lastModified: new Date().toISOString(),
        pageType: 'ruled'
      };

      setRecentNotes(prevNotes => {
        const filtered = prevNotes.filter(n => n.filePath !== filePath);
        return [newNoteEntry, ...filtered];
      });

      // STEP 4: Re-open & read newly created file directly from disk
      const readRes = await window.electronAPI.readFileContent({ filePath });
      if (!readRes || !readRes.success) {
        alert(`Error reading newly created file from disk:\n${filePath}`);
        return;
      }

      const parsed = parseFileContent(readRes.content || '', fileFormat);

      // STEP 5: Initialize editor session with valid physical file record
      const fileRecord = {
        name: fileName,
        path: filePath,
        format: fileFormat
      };

      setActiveFile(fileRecord);
      setEditorContent(parsed.html);
      setFloatingObjects(parsed.floatingObjects || []);
      setNoteType('ruled');
      setZoom(100);
      setScreen('editor');

      // Persist Session
      const sessionData = {
        screen: 'editor',
        activeFile: fileRecord,
        noteType: 'ruled',
        content: parsed.html,
        floatingObjects: parsed.floatingObjects || [],
        zoom: 100,
        scrollTop: 0
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));

    } catch (err) {
      console.error('New note creation error:', err);
      alert(`An error occurred during note creation:\n${err.message}`);
    }
  };

  // MANDATORY OPEN NOTE FLOW (Verify Disk -> Read Disk -> Render)
  const handleOpenNote = async (fileObj) => {
    let targetPath = fileObj ? (fileObj.filePath || fileObj.path) : null;
    let targetName = fileObj ? (fileObj.fileName || fileObj.name) : null;

    // Step 1: Open file dialog if no target path provided
    if (!targetPath && window.electronAPI) {
      const openRes = await window.electronAPI.openFileDialog();
      if (!openRes || !openRes.success || !openRes.filePath) {
        return; // User canceled
      }
      targetPath = openRes.filePath;
      targetName = openRes.fileName;
    }

    if (!targetPath) return;

    // Step 2: Verify file exists on disk
    if (window.electronAPI) {
      const checkRes = await window.electronAPI.checkFileExists({ filePath: targetPath });
      if (!checkRes || !checkRes.exists) {
        alert(`Cannot open note: The physical file no longer exists on disk:\n${targetPath}`);
        setRecentNotes(prev => prev.filter(n => n.filePath !== targetPath));
        return;
      }
    }

    // Step 3: Read file from disk
    let rawContent = '';
    if (window.electronAPI) {
      const readRes = await window.electronAPI.readFileContent({ filePath: targetPath });
      if (!readRes || !readRes.success) {
        alert(`Failed to read file contents from disk:\n${targetPath}`);
        return;
      }
      rawContent = readRes.content;
    }

    const name = targetName || targetPath.split(/[\\/]/).pop();
    const ext = name.split('.').pop().toLowerCase();
    const format = ext === 'txt' ? 'txt' : 'md';

    // Step 4: Parse metadata and content
    const parsed = parseFileContent(rawContent, format);

    const fileRecord = {
      name,
      path: targetPath,
      format
    };

    // Step 5 & 6: Initialize editor and register in workspace
    setActiveFile(fileRecord);
    setEditorContent(parsed.html);
    setFloatingObjects(parsed.floatingObjects || []);
    setScreen('editor');

    const recentEntry = {
      fileName: name,
      filePath: targetPath,
      fileFormat: format,
      folderPath: 'Documents',
      lastModified: new Date().toISOString(),
      pageType: fileObj?.pageType || 'ruled'
    };
    setRecentNotes(prev => [recentEntry, ...prev.filter(n => n.filePath !== targetPath)]);
  };

  // Immediate Manual Save to Disk
  const handleSaveFile = async () => {
    if (!activeFile || !activeFile.path || !window.electronAPI) return;
    setSaveState('saving');
    const serializedData = serializeFileContent(editorContent, activeFile.format, floatingObjects);
    await window.electronAPI.saveFileContent({
      filePath: activeFile.path,
      content: serializedData
    });
    setSaveState('saved');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      setSaveState('idle');
    }, 2000);
  };

  // Intentional Return to Home Screen
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
      {/* WINDOWS NATIVE TITLEBAR HEADER */}
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
                className={`btn-compact no-drag ${saveState === 'saved' ? 'btn-saved-active' : ''}`}
                style={{ 
                  height: 28, 
                  fontSize: 12, 
                  padding: '0 12px',
                  transition: 'all 200ms ease',
                  backgroundColor: saveState === 'saved' ? '#10B981' : undefined,
                  color: saveState === 'saved' ? '#FFFFFF' : undefined,
                  borderColor: saveState === 'saved' ? '#10B981' : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}
                onClick={handleSaveFile}
                title="Save Note (Ctrl+S)"
              >
                {saveState === 'saved' ? (
                  <>
                    <Check size={14} color="#FFFFFF" />
                    <span style={{ fontWeight: 600 }}>Saved!</span>
                  </>
                ) : saveState === 'saving' ? (
                  <>
                    <Save size={13} color="var(--accent)" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={13} color="var(--accent)" />
                    <span>Save</span>
                  </>
                )}
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
