import React, { useState, useEffect, useRef, useCallback } from 'react';
import HomeScreen from './components/HomeScreen';
import EditorCanvas from './components/EditorCanvas';
import SearchOverlay from './components/SearchOverlay';
import ExportModal from './components/ExportModal';
import TabBar from './components/TabBar';
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
  Check,
  ChevronDown,
  Type,
  BookOpen,
  Printer
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
  const [openTabs, setOpenTabs] = useState([]);
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
  const [isPrintPreview, setIsPrintPreview] = useState(false);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [saveState, setSaveState] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const [selectedFontLabel, setSelectedFontLabel] = useState('Playpen Sans');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitleName, setTempTitleName] = useState('');

  // Pinned Notes & Custom Rename States
  const [pinnedPaths, setPinnedPaths] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fluent_notes_pinned_paths') || '[]');
    } catch (e) {
      return [];
    }
  });

  const handleTogglePinNote = (note) => {
    if (!note || !note.filePath) return;
    setPinnedPaths(prev => {
      const next = prev.includes(note.filePath)
        ? prev.filter(p => p !== note.filePath)
        : [...prev, note.filePath];
      localStorage.setItem('fluent_notes_pinned_paths', JSON.stringify(next));
      return next;
    });
  };

  const handleRenameNote = async (notePath, newName) => {
    if (!window.electronAPI) return;
    let cleanName = newName.trim();
    if (!cleanName) return;
    const ext = notePath.split('.').pop();
    if (!cleanName.endsWith(`.${ext}`)) {
      cleanName += `.${ext}`;
    }

    try {
      if (screen === 'editor' && activeFile && activeFile.path === notePath) {
        const serializedData = serializeFileContent(editorContent, activeFile.format, floatingObjects);
        await window.electronAPI.saveFileContent({
          filePath: notePath,
          content: serializedData
        });
      }

      const res = await window.electronAPI.renameFile({ oldPath: notePath, newName: cleanName });
      if (res && res.success && res.newPath) {
        setOpenTabs(prev => prev.map(t => t.path === notePath ? { ...t, name: res.newFileName, path: res.newPath } : t));
        if (activeFile && activeFile.path === notePath) {
          setActiveFile({
            name: res.newFileName,
            path: res.newPath,
            format: activeFile.format
          });
        }
        setRecentNotes(prev => prev.map(n => n.filePath === notePath ? { ...n, fileName: res.newFileName, filePath: res.newPath } : n));
        
        const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
        if (savedSession) {
          const session = JSON.parse(savedSession);
          if (session.activeFile && session.activeFile.path === notePath) {
            session.activeFile.name = res.newFileName;
            session.activeFile.path = res.newPath;
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
          }
        }
      } else {
        alert(`Rename failed: ${res?.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Rename error:', err);
      alert(`Rename error: ${err.message}`);
    }
  };

  const FONT_OPTIONS = [
    { label: 'Playpen Sans', value: "'Playpen Sans', cursive, sans-serif" },
    { label: 'Fredoka', value: "'Fredoka', sans-serif" },
    { label: 'Times New Roman', value: "'Times New Roman', Times, serif" }
  ];

  const handleSelectFont = (fontItem) => {
    setSelectedFontLabel(fontItem.label);
    setIsFontDropdownOpen(false);
    if (editorInstanceRef.current) {
      editorInstanceRef.current.chain().focus().setFontFamily(fontItem.value).run();
    }
  };

  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!e.target.closest('.font-popover-dropdown') && !e.target.closest('.btn-compact')) {
        setIsFontDropdownOpen(false);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

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

                  // CRITICAL FIX: Restore floating objects from parsed file data OR session localStorage fallback
                  const restoredObjects = (parsed.floatingObjects && parsed.floatingObjects.length > 0)
                    ? parsed.floatingObjects
                    : (session.floatingObjects && session.floatingObjects.length > 0 ? session.floatingObjects : []);

                  setFloatingObjects(restoredObjects);
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
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [editorContent, floatingObjects, activeFile, screen]);

  // BEFOREUNLOAD SYNC FLUSH (Guarantees zero data loss on page refresh/reload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (screen === 'editor' && activeFile && activeFile.path && window.electronAPI) {
        const serializedData = serializeFileContent(editorContent, activeFile.format, floatingObjects);
        window.electronAPI.saveFileContent({
          filePath: activeFile.path,
          content: serializedData
        });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [screen, activeFile, editorContent, floatingObjects]);

  // Global Keyboard Shortcuts Refs to prevent listener re-registrations
  const handleSaveFileRef = useRef(null);
  const handleCreateNewNoteRef = useRef(null);
  const handleOpenNoteRef = useRef(null);
  const setIsSearchOpenRef = useRef(setIsSearchOpen);
  const screenRef = useRef(screen);

  useEffect(() => {
    handleSaveFileRef.current = handleSaveFile;
    handleCreateNewNoteRef.current = handleCreateNewNote;
    handleOpenNoteRef.current = handleOpenNote;
    setIsSearchOpenRef.current = setIsSearchOpen;
    screenRef.current = screen;
  });

  // Global Keyboard Shortcuts Hook (Ctrl+S, Ctrl+N, Ctrl+O, Ctrl+F)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      if (!isCtrl) return;

      const key = e.key.toLowerCase();
      if (key === 's') {
        e.preventDefault();
        if (screenRef.current === 'editor') {
          handleSaveFileRef.current();
        }
      } else if (key === 'n') {
        e.preventDefault();
        handleCreateNewNoteRef.current('md');
      } else if (key === 'o') {
        e.preventDefault();
        handleOpenNoteRef.current();
      } else if (key === 'f') {
        if (screenRef.current === 'editor') {
          e.preventDefault();
          setIsSearchOpenRef.current(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

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
      setOpenTabs(prev => prev.some(t => t.path === fileRecord.path) ? prev : [...prev, fileRecord]);
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
    setOpenTabs(prev => prev.some(t => t.path === fileRecord.path) ? prev : [...prev, fileRecord]);
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

  const handleCloseTab = (tabToClose) => {
    const updatedTabs = openTabs.filter(t => t.path !== tabToClose.path);
    setOpenTabs(updatedTabs);

    if (activeFile && activeFile.path === tabToClose.path) {
      if (updatedTabs.length > 0) {
        const nextTab = updatedTabs[updatedTabs.length - 1];
        handleOpenNote({ path: nextTab.path, name: nextTab.name });
      } else {
        setScreen('home');
        setActiveFile(null);
      }
    }
  };

  const sortedRecentNotes = [...recentNotes].sort((a, b) => {
    if (!a || !b) return 0;
    const aPinned = pinnedPaths.includes(a.filePath);
    const bPinned = pinnedPaths.includes(b.filePath);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return new Date(b.lastModified || 0) - new Date(a.lastModified || 0);
  });

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

          {screen === 'editor' && activeFile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="no-drag">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={tempTitleName}
                  onChange={(e) => setTempTitleName(e.target.value)}
                  onBlur={() => {
                    if (tempTitleName.trim() && tempTitleName.trim() !== activeFile.name) {
                      handleRenameNote(activeFile.path, tempTitleName.trim());
                    }
                    setIsEditingTitle(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (tempTitleName.trim() && tempTitleName.trim() !== activeFile.name) {
                        handleRenameNote(activeFile.path, tempTitleName.trim());
                      }
                      setIsEditingTitle(false);
                    } else if (e.key === 'Escape') {
                      setIsEditingTitle(false);
                    }
                  }}
                  autoFocus
                  style={{
                    background: 'var(--bg-app)',
                    border: '1px solid var(--accent)',
                    borderRadius: 4,
                    padding: '2px 8px',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    outline: 'none',
                    height: 24,
                    width: 200
                  }}
                />
              ) : (
                <div 
                  style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                  onClick={() => {
                    setTempTitleName(activeFile.name);
                    setIsEditingTitle(true);
                  }}
                  title="Click to rename note"
                >
                  <span style={{ fontWeight: 600 }}>{activeFile.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>(Click to Rename)</span>
                </div>
              )}
            </div>
          ) : (
            <span style={{ fontWeight: 600 }}>Study Notes</span>
          )}
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {screen === 'editor' && (
            <>
              {/* Custom Font Picker Dropdown */}
              <div style={{ position: 'relative' }} className="no-drag">
                <button 
                  className="btn-compact" 
                  style={{ height: 28, fontSize: 12, padding: '0 8px', display: 'flex', alignItems: 'center', gap: 5 }}
                  onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
                  title="Choose Font (Playpen Sans, Fredoka, Times New Roman)"
                >
                  <Type size={13} color="var(--accent)" />
                  <span style={{ fontFamily: selectedFontLabel === 'Times New Roman' ? 'Times New Roman, serif' : (selectedFontLabel === 'Fredoka' ? 'Fredoka, sans-serif' : 'Playpen Sans, cursive') }}>
                    {selectedFontLabel}
                  </span>
                  <ChevronDown size={12} color="var(--text-muted)" />
                </button>

                {isFontDropdownOpen && (
                  <div 
                    className="toolbar-group-popover font-popover-dropdown" 
                    style={{ 
                      position: 'absolute', 
                      top: 'calc(100% + 4px)', 
                      right: 0, 
                      width: 170, 
                      maxHeight: 200,
                      overflowY: 'auto',
                      zIndex: 999999, 
                      padding: 4,
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 8,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.16)'
                    }}
                  >
                    {FONT_OPTIONS.map(font => (
                      <button
                        key={font.label}
                        className={`list-popover-item ${selectedFontLabel === font.label ? 'active' : ''}`}
                        style={{ 
                          fontFamily: font.value, 
                          fontSize: 13, 
                          padding: '8px 10px', 
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleSelectFont(font)}
                      >
                        <span>{font.label}</span>
                        {selectedFontLabel === font.label && <Check size={13} color="var(--accent)" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

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

              {/* View Mode Toggle (Notebook / Print Preview) */}
              <button 
                className={`btn-compact no-drag ${isPrintPreview ? 'btn-saved-active' : ''}`}
                style={{ 
                  height: 28, 
                  fontSize: 12, 
                  padding: '0 10px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 4,
                  backgroundColor: isPrintPreview ? 'var(--accent)' : undefined,
                  color: isPrintPreview ? '#FFFFFF' : undefined,
                  borderColor: isPrintPreview ? 'var(--accent)' : undefined,
                }}
                onClick={() => setIsPrintPreview(!isPrintPreview)}
                title="Toggle Print/A4 Preview Mode"
              >
                {isPrintPreview ? <Printer size={13} /> : <BookOpen size={13} />}
                <span>{isPrintPreview ? 'Print A4' : 'Notebook'}</span>
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
            title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
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

      {/* MULTI-TAB NOTE WORKSPACE BAR */}
      {screen === 'editor' && openTabs.length > 0 && (
        <TabBar 
          openTabs={openTabs}
          activeTabPath={activeFile?.path}
          onSelectTab={(tab) => handleOpenNote({ path: tab.path, name: tab.name })}
          onCloseTab={handleCloseTab}
          onNewTab={() => handleCreateNewNote('md')}
          onRenameTab={handleRenameNote}
        />
      )}

      {/* SCREEN ROUTER */}
      {screen === 'home' ? (
        <HomeScreen 
          recentNotes={sortedRecentNotes}
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
          pinnedPaths={pinnedPaths}
          onTogglePinNote={handleTogglePinNote}
        />
      ) : (
        <EditorCanvas 
          content={editorContent}
          onContentChange={setEditorContent}
          onActiveFontChange={(fontLabel) => setSelectedFontLabel(fontLabel)}
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
          theme={theme}
          isPrintPreview={isPrintPreview}
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
