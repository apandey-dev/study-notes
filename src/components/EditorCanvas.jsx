import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Extension } from '@tiptap/core';
import { CustomSlashCommands } from '../utils/customSlashCommandsExtension';
import { FontFamily } from '../utils/customFontFamilyExtension';
import Toolbar from './Toolbar';
import FloatingObjectLayer from './FloatingObjectLayer';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import InsertTableModal from './InsertTableModal';
import { 
  Heading1, Heading2, Heading3, Heading4, 
  List, ListOrdered, CheckSquare, 
  Type, Image as ImageIcon, MessageSquare, 
  Code, Calendar, Clock, Minus, AlertTriangle, FileText,
  Table as TableIcon, Trash2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight
} from 'lucide-react';

const SLASH_SUGGESTIONS = [
  { label: '/table', desc: 'Insert Table (Custom Rows & Cols)', icon: TableIcon, command: 'table' },
  { label: '/h1', desc: 'Heading 1', icon: Heading1, command: 'h1' },
  { label: '/h2', desc: 'Heading 2', icon: Heading2, command: 'h2' },
  { label: '/h3', desc: 'Heading 3', icon: Heading3, command: 'h3' },
  { label: '/h4', desc: 'Heading 4', icon: Heading4, command: 'h4' },
  { label: '/b', desc: 'Bullet List', icon: List, command: 'b' },
  { label: '/n', desc: 'Numbered List', icon: ListOrdered, command: 'n' },
  { label: '/c', desc: 'Interactive Checklist', icon: CheckSquare, command: 'c' },
  { label: '/tb', desc: 'Insert Floating Text Block (Transparent)', icon: FileText, command: 'textblock' },
  { label: '/sticky', desc: 'Insert Sticky Note (Paper)', icon: Type, command: 'sticky' },
  { label: '/img', desc: 'Insert Image', icon: ImageIcon, command: 'img' },
  { label: '/note', desc: 'Blue Note Callout', icon: MessageSquare, command: 'note' },
  { label: '/tip', desc: 'Green Tip Callout', icon: MessageSquare, command: 'tip' },
  { label: '/warn', desc: 'Warning Callout', icon: AlertTriangle, command: 'warn' },
  { label: '/q', desc: 'Quote Block', icon: MessageSquare, command: 'q' },
  { label: '/code', desc: 'Code Block', icon: Code, command: 'code' },
  { label: '/hr', desc: 'Horizontal Line', icon: Minus, command: 'hr' },
  { label: '/date', desc: 'Insert Today\'s Date', icon: Calendar, command: 'date' },
  { label: '/time', desc: 'Insert Current Time', icon: Clock, command: 'time' }
];

const FormatKeymaps = Extension.create({
  name: 'formatKeymaps',
  addKeyboardShortcuts() {
    return {
      'Mod-b': ({ editor }) => editor.chain().focus().toggleBold().run(),
      'Control-b': ({ editor }) => editor.chain().focus().toggleBold().run(),
      'Mod-i': ({ editor }) => editor.chain().focus().toggleItalic().run(),
      'Control-i': ({ editor }) => editor.chain().focus().toggleItalic().run(),
      'Mod-u': ({ editor }) => editor.chain().focus().toggleUnderline().run(),
      'Control-u': ({ editor }) => editor.chain().focus().toggleUnderline().run(),
      'Tab': ({ editor }) => {
        if (editor.isActive('bulletList') || editor.isActive('orderedList') || editor.isActive('taskList')) {
          return editor.commands.sinkListItem('listItem') || editor.commands.sinkListItem('taskItem');
        }
        return editor.commands.insertContent('\u00a0\u00a0\u00a0\u00a0');
      },
      'Shift-Tab': ({ editor }) => {
        if (editor.isActive('bulletList') || editor.isActive('orderedList') || editor.isActive('taskList')) {
          return editor.commands.liftListItem('listItem') || editor.commands.liftListItem('taskItem');
        }
        return false;
      }
    };
  }
});

// STATIC EXTENSIONS ARRAY - Defined outside component to prevent reference changes across re-renders
const EDITOR_EXTENSIONS = [
  StarterKit,
  Underline,
  TaskList,
  TaskItem.configure({ nested: true }),
  TextStyle,
  FontFamily,
  Color,
  Table.configure({
    resizable: true,
    HTMLAttributes: {
      class: 'study-editor-table',
    },
  }),
  TableRow,
  TableHeader,
  TableCell,
  CustomSlashCommands,
  FormatKeymaps
];

export default function EditorCanvas({
  content,
  onContentChange,
  onActiveFontChange,
  noteType,
  fileFormat,
  pageSize,
  customWidth,
  customHeight,
  wordWrap,
  zoom,
  paperRef,
  setEditorInstance,
  onOpenSearch,
  floatingObjects = [],
  onUpdateFloatingObjects,
  fileKey = 'default_note'
}) {
  const [pendingPlacement, setPendingPlacement] = useState(null); // { type: 'image' | 'sticky' | 'textBlock', src? }
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isConnectionModeActive, setIsConnectionModeActive] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [tableContextMenu, setTableContextMenu] = useState(null); // { x, y }

  // Autocomplete Menu State
  const [slashMenu, setSlashMenu] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleGlobalClick = () => setTableContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handlePaperContextMenu = (e) => {
    const tableEl = e.target.closest('table');
    if (tableEl) {
      e.preventDefault();
      e.stopPropagation();
      setTableContextMenu({ x: e.clientX, y: e.clientY });
    }
  };

  const handleInsertTable = ({ rows, cols, withHeaderRow }) => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow }).run();
  };

  // Capture initial content & current file key to prevent setContent loop
  const initialContentRef = useRef(content || '');
  const lastLoadedFileKeyRef = useRef(fileKey);

  // TipTap Rich Text Editor Instance - Instantiated EXACTLY ONCE with [] dependencies
  const editor = useEditor({
    extensions: EDITOR_EXTENSIONS,
    editorProps: {
      attributes: {
        dir: 'ltr',
        spellcheck: 'false',
        style: 'direction: ltr !important; text-align: left !important; unicode-bidi: isolate;'
      }
    },
    content: initialContentRef.current,
    autofocus: 'start',
    onSelectionUpdate: ({ editor: ed }) => {
      const attrs = ed.getAttributes('textStyle');
      const family = attrs.fontFamily;
      if (family && onActiveFontChange) {
        if (family.includes('Times New Roman')) {
          onActiveFontChange('Times New Roman');
        } else if (family.includes('Fredoka')) {
          onActiveFontChange('Fredoka');
        } else if (family.includes('Playpen')) {
          onActiveFontChange('Playpen Sans');
        }
      }
    },
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML());

      // Detect / or .. Slash Command Autocomplete Query
      const { selection } = editor.state;
      const { $from } = selection;
      const currentLineText = $from.nodeBefore ? $from.nodeBefore.text || '' : '';
      const match = currentLineText.match(/(?:\/|\.\.)([a-zA-Z0-9]*)$/);

      if (match) {
        const query = match[1].toLowerCase();
        const coords = editor.view.coordsAtPos(selection.from);
        setSlashMenu({
          query,
          x: coords.left,
          y: coords.bottom + 6,
          selectedIdx: 0
        });
      } else {
        setSlashMenu(null);
      }
    }
  }, []);

  useEffect(() => {
    if (editor) {
      setEditorInstance(editor);
    }
  }, [editor, setEditorInstance]);

  // STEP 6: Set content and focus cursor to the start of the document when opening/creating note
  useEffect(() => {
    if (editor && fileKey !== lastLoadedFileKeyRef.current) {
      lastLoadedFileKeyRef.current = fileKey;
      editor.commands.setContent(content || '');
      setTimeout(() => {
        if (editor && !editor.isDestroyed) {
          editor.commands.focus('start');
        }
      }, 50);
    }
  }, [fileKey, content, editor]);

  // Track Mouse Position & Keyboard Nav for Autocomplete & Placement Mode
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (pendingPlacement) {
        setMousePos({ x: e.clientX, y: e.clientY });
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (pendingPlacement) setPendingPlacement(null);
        if (slashMenu) setSlashMenu(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pendingPlacement, slashMenu]);

  // Placement Handlers
  const handlePrepareInsertImage = (src) => {
    if (fileFormat === 'txt') {
      alert('Images are supported only in Markdown (.md) notes.');
      return;
    }
    setPendingPlacement({ type: 'image', src });
  };

  const handlePrepareInsertStickyNote = () => {
    if (fileFormat === 'txt') {
      alert('Sticky Notes are supported only in Markdown (.md) notes.');
      return;
    }
    setPendingPlacement({ type: 'sticky' });
  };

  const handlePrepareInsertTextBlock = () => {
    if (fileFormat === 'txt') {
      alert('Floating Text Blocks are supported only in Markdown (.md) notes.');
      return;
    }
    setPendingPlacement({ type: 'textBlock' });
  };

  const handleOpenNativeImagePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          handlePrepareInsertImage(evt.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Execute Slash Command Item
  const handleExecuteSlashCommand = (item) => {
    if (!editor) return;
    setSlashMenu(null);

    // Delete slash text
    const { selection } = editor.state;
    const { $from } = selection;
    const currentLineText = $from.nodeBefore ? $from.nodeBefore.text || '' : '';
    const match = currentLineText.match(/(?:\/|\.\.)([a-zA-Z0-9]*)$/);

    if (match) {
      const deleteLen = match[0].length;
      editor.chain().focus().deleteRange({ from: selection.from - deleteLen, to: selection.from }).run();
    }

    // Execute specific command
    switch (item.command) {
      case 'table': setIsTableModalOpen(true); break;
      case 'h1': editor.chain().focus().toggleHeading({ level: 1 }).run(); break;
      case 'h2': editor.chain().focus().toggleHeading({ level: 2 }).run(); break;
      case 'h3': editor.chain().focus().toggleHeading({ level: 3 }).run(); break;
      case 'h4': editor.chain().focus().toggleHeading({ level: 4 }).run(); break;
      case 'b': editor.chain().focus().toggleBulletList().run(); break;
      case 'n': editor.chain().focus().toggleOrderedList().run(); break;
      case 'c': editor.chain().focus().toggleTaskList().run(); break;
      case 'textblock': handlePrepareInsertTextBlock(); break;
      case 'sticky': handlePrepareInsertStickyNote(); break;
      case 'img': handleOpenNativeImagePicker(); break;
      case 'note': editor.chain().focus().insertContent('<blockquote class="callout-box callout-note"><strong>Note: </strong> </blockquote>').run(); break;
      case 'tip': editor.chain().focus().insertContent('<blockquote class="callout-box callout-tip"><strong>Tip: </strong> </blockquote>').run(); break;
      case 'warn': editor.chain().focus().insertContent('<blockquote class="callout-box callout-warn"><strong>Warning: </strong> </blockquote>').run(); break;
      case 'q': editor.chain().focus().toggleBlockquote().run(); break;
      case 'code': editor.chain().focus().toggleCodeBlock().run(); break;
      case 'hr': editor.chain().focus().setHorizontalRule().run(); break;
      case 'date': 
        const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
        editor.chain().focus().insertContent(dateStr).run(); 
        break;
      case 'time': 
        const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        editor.chain().focus().insertContent(timeStr).run(); 
        break;
      default: break;
    }
  };

  // ONE-TIME PLACEMENT HANDLER: Executed when user clicks on notebook paper
  const handlePaperClickToPlace = (e) => {
    if (!pendingPlacement) return;

    e.preventDefault();
    e.stopPropagation();

    if (!paperRef.current) return;
    const rect = paperRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const objWidth = pendingPlacement.type === 'image' ? 320 : (pendingPlacement.type === 'textBlock' ? 280 : 240);
    const objHeight = pendingPlacement.type === 'image' ? 220 : (pendingPlacement.type === 'textBlock' ? 160 : 180);

    const posX = Math.max(0, Math.round(clickX - objWidth / 2));
    const posY = Math.max(0, Math.round(clickY - objHeight / 2));

    const prefix = pendingPlacement.type === 'image' ? 'img_' : (pendingPlacement.type === 'textBlock' ? 'tb_' : 'sticky_');
    const newId = prefix + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

    let newObj;
    if (pendingPlacement.type === 'image') {
      newObj = {
        id: newId,
        type: 'image',
        src: pendingPlacement.src,
        x: posX,
        y: posY,
        width: objWidth,
        height: objHeight,
        zIndex: (floatingObjects?.length || 0) + 10
      };
    } else if (pendingPlacement.type === 'textBlock') {
      newObj = {
        id: newId,
        type: 'textBlock',
        content: '<p>Floating text block...</p>',
        x: posX,
        y: posY,
        width: objWidth,
        height: objHeight,
        fontSize: 16,
        zIndex: (floatingObjects?.length || 0) + 10,
        autoEdit: true
      };
    } else {
      newObj = {
        id: newId,
        type: 'text',
        content: 'Click to edit note...',
        bgColor: '#FEF9C3',
        bgDarkColor: '#383214',
        textColor: '#713F12',
        textDarkColor: '#FEF08A',
        x: posX,
        y: posY,
        width: objWidth,
        height: objHeight,
        zIndex: (floatingObjects?.length || 0) + 10,
        autoEdit: true
      };
    }

    onUpdateFloatingObjects && onUpdateFloatingObjects([...floatingObjects, newObj]);
    setPendingPlacement(null);
  };

  const handlePasteOrDrop = (e) => {
    if (fileFormat === 'txt' || e.defaultPrevented) return;
    if (e.target.closest('.floating-object-overlay-layer')) return;

    const items = (e.clipboardData || e.dataTransfer)?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          e.stopPropagation();
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              handlePrepareInsertImage(event.target.result);
            }
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
  };

  const filteredSuggestions = slashMenu 
    ? SLASH_SUGGESTIONS.filter(s => s.label.toLowerCase().includes(slashMenu.query) || s.desc.toLowerCase().includes(slashMenu.query))
    : [];

  return (
    <div 
      className={`editor-main-viewport ${pendingPlacement ? 'placement-mode-active' : ''}`}
      style={{ direction: 'ltr', textAlign: 'left' }}
      onClick={(e) => {
        if (pendingPlacement) {
          handlePaperClickToPlace(e);
          return;
        }
        if (!e.target.closest('.floating-object-overlay-layer') && !e.target.closest('.floating-vertical-toolbar')) {
          if (editor) editor.commands.focus();
        }
      }}
      onContextMenu={(e) => {
        if (pendingPlacement) {
          e.preventDefault();
          e.stopPropagation();
          setPendingPlacement(null);
        }
      }}
      onPaste={handlePasteOrDrop}
      onDrop={handlePasteOrDrop}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageFileSelected}
      />

      {/* Centered Notebook Paper Container */}
      <div className="centered-editor-container" style={{ direction: 'ltr', textAlign: 'left' }}>
        <div 
          ref={paperRef}
          className={`study-paper ${noteType === 'ruled' ? 'ruled-page' : 'blank-page'}`}
          onContextMenu={handlePaperContextMenu}
          style={{
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            direction: 'ltr',
            textAlign: 'left'
          }}
        >
          {/* CONTEXTUAL TABLE ACTION TOOLBAR (Visible when cursor is inside a table) */}
          {(isInsideTable || Boolean(editor && (editor.isActive('table') || editor.isActive('tableCell') || editor.isActive('tableHeader') || editor.isActive('tableRow')))) && (
            <div 
              className="table-floating-toolbar"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                marginBottom: 14,
                width: 'fit-content',
                zIndex: 999
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 6 }}>
                <TableIcon size={14} color="var(--accent)" />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>Table:</span>
              </div>

              {/* Add Row Controls */}
              <button
                type="button"
                className="btn-compact"
                onClick={() => editor.chain().focus().addRowBefore().run()}
                title="Add Row Above"
                style={{ height: 26, fontSize: 11, padding: '0 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <ArrowUp size={12} color="var(--text-secondary)" />
                <span>+ Row Above</span>
              </button>

              <button
                type="button"
                className="btn-compact"
                onClick={() => editor.chain().focus().addRowAfter().run()}
                title="Add Row Below"
                style={{ height: 26, fontSize: 11, padding: '0 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <ArrowDown size={12} color="var(--text-secondary)" />
                <span>+ Row Below</span>
              </button>

              <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', margin: '0 2px' }} />

              {/* Add Column Controls */}
              <button
                type="button"
                className="btn-compact"
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                title="Add Column Left"
                style={{ height: 26, fontSize: 11, padding: '0 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <ArrowLeft size={12} color="var(--text-secondary)" />
                <span>+ Col Left</span>
              </button>

              <button
                type="button"
                className="btn-compact"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                title="Add Column Right"
                style={{ height: 26, fontSize: 11, padding: '0 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <ArrowRight size={12} color="var(--text-secondary)" />
                <span>+ Col Right</span>
              </button>

              <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', margin: '0 2px' }} />

              {/* Single Row Delete */}
              <button
                type="button"
                className="btn-compact"
                onClick={() => editor.chain().focus().deleteRow().run()}
                title="Delete Current Row"
                style={{ height: 26, fontSize: 11, padding: '0 8px', borderRadius: 6, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Trash2 size={12} color="#EF4444" />
                <span>Delete Row</span>
              </button>

              {/* Single Column Delete */}
              <button
                type="button"
                className="btn-compact"
                onClick={() => editor.chain().focus().deleteColumn().run()}
                title="Delete Current Column"
                style={{ height: 26, fontSize: 11, padding: '0 8px', borderRadius: 6, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Trash2 size={12} color="#EF4444" />
                <span>Delete Col</span>
              </button>

              <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', margin: '0 2px' }} />

              {/* Entire Table Delete */}
              <button
                type="button"
                className="btn-compact"
                onClick={() => editor.chain().focus().deleteTable().run()}
                title="Remove Entire Table"
                style={{ 
                  height: 26, 
                  fontSize: 11, 
                  padding: '0 10px', 
                  borderRadius: 6, 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                  color: '#EF4444', 
                  border: '1px solid rgba(239, 68, 68, 0.3)', 
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Trash2 size={12} color="#EF4444" />
                <span>Remove Table</span>
              </button>
            </div>
          )}

          {/* Normal Document Text Flow */}
          <EditorContent editor={editor} dir="ltr" style={{ direction: 'ltr', textAlign: 'left', whiteSpace: 'pre-wrap', overflowWrap: 'break-word', wordBreak: 'break-word' }} />

          {/* Independent Floating Object Overlay Layer */}
          <FloatingObjectLayer 
            objects={floatingObjects}
            onUpdateObjects={onUpdateFloatingObjects}
            paperRef={paperRef}
            fileFormat={fileFormat}
            isConnectionModeActive={isConnectionModeActive}
            onToggleConnectionMode={() => setIsConnectionModeActive(!isConnectionModeActive)}
          />
        </div>
      </div>

      {/* COMPACT SLASH COMMAND AUTOCOMPLETE POPUP MENU */}
      {slashMenu && filteredSuggestions.length > 0 && (
        <div 
          className="slash-autocomplete-menu"
          style={{
            position: 'fixed',
            left: Math.min(slashMenu.x, window.innerWidth - 220),
            top: Math.min(slashMenu.y, window.innerHeight - 260),
            zIndex: 9999
          }}
        >
          {filteredSuggestions.map((item, idx) => {
            const IconComp = item.icon;
            const isSelected = idx === (slashMenu.selectedIdx || 0);

            return (
              <button
                key={item.label}
                className={`slash-menu-item ${isSelected ? 'selected' : ''}`}
                onClick={() => handleExecuteSlashCommand(item)}
              >
                <IconComp size={15} color="var(--accent)" />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span className="slash-label">{item.label}</span>
                  <span className="slash-desc">{item.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* FLOATING CURSOR TOOLTIP IN PLACEMENT MODE */}
      {pendingPlacement && (
        <div 
          className="placement-cursor-tooltip"
          style={{
            position: 'fixed',
            left: mousePos.x + 14,
            top: mousePos.y + 14,
            zIndex: 9999,
            pointerEvents: 'none',
            direction: 'ltr'
          }}
        >
          Click to place • Esc to cancel
        </div>
      )}

      {/* RIGHT-CLICK TABLE CONTEXT MENU */}
      {tableContextMenu && (
        <div 
          className="toolbar-group-popover table-context-menu-popover"
          style={{
            position: 'fixed',
            left: Math.min(tableContextMenu.x, window.innerWidth - 185),
            top: Math.min(tableContextMenu.y, window.innerHeight - 270),
            zIndex: 999999,
            width: 180,
            padding: 6,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 10,
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', padding: '4px 8px', marginBottom: 4, borderBottom: '1px solid var(--border-subtle)' }}>
            Table Options
          </div>

          <button 
            type="button"
            className="list-popover-item" 
            onClick={() => { editor.chain().focus().addRowBefore().run(); setTableContextMenu(null); }}
            style={{ padding: '6px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}
          >
            <ArrowUp size={13} color="var(--text-secondary)" />
            <span>Add Row Above</span>
          </button>

          <button 
            type="button"
            className="list-popover-item" 
            onClick={() => { editor.chain().focus().addRowAfter().run(); setTableContextMenu(null); }}
            style={{ padding: '6px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}
          >
            <ArrowDown size={13} color="var(--text-secondary)" />
            <span>Add Row Below</span>
          </button>

          <button 
            type="button"
            className="list-popover-item" 
            onClick={() => { editor.chain().focus().addColumnBefore().run(); setTableContextMenu(null); }}
            style={{ padding: '6px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}
          >
            <ArrowLeft size={13} color="var(--text-secondary)" />
            <span>Add Col Left</span>
          </button>

          <button 
            type="button"
            className="list-popover-item" 
            onClick={() => { editor.chain().focus().addColumnAfter().run(); setTableContextMenu(null); }}
            style={{ padding: '6px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}
          >
            <ArrowRight size={13} color="var(--text-secondary)" />
            <span>Add Col Right</span>
          </button>

          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

          <button 
            type="button"
            className="list-popover-item" 
            onClick={() => { editor.chain().focus().deleteRow().run(); setTableContextMenu(null); }}
            style={{ padding: '6px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#EF4444', width: '100%' }}
          >
            <Trash2 size={13} color="#EF4444" />
            <span>Delete Row</span>
          </button>

          <button 
            type="button"
            className="list-popover-item" 
            onClick={() => { editor.chain().focus().deleteColumn().run(); setTableContextMenu(null); }}
            style={{ padding: '6px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#EF4444', width: '100%' }}
          >
            <Trash2 size={13} color="#EF4444" />
            <span>Delete Col</span>
          </button>

          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

          <button 
            type="button"
            className="list-popover-item" 
            onClick={() => { editor.chain().focus().deleteTable().run(); setTableContextMenu(null); }}
            style={{ padding: '6px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#EF4444', fontWeight: 600, background: 'rgba(239, 68, 68, 0.08)', width: '100%' }}
          >
            <Trash2 size={13} color="#EF4444" />
            <span>Remove Table</span>
          </button>
        </div>
      )}

      {/* INSERT TABLE MODAL */}
      <InsertTableModal 
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        onInsert={handleInsertTable}
      />

      {/* Floating Vertical Toolbar */}
      <Toolbar 
        editor={editor}
        fileFormat={fileFormat}
        zoom={zoom}
        onOpenSearch={onOpenSearch}
        onInsertImage={() => handleOpenNativeImagePicker()}
        onAddStickyNote={handlePrepareInsertStickyNote}
        onAddFloatingTextBlock={handlePrepareInsertTextBlock}
        onOpenInsertTableModal={() => setIsTableModalOpen(true)}
        isConnectionModeActive={isConnectionModeActive}
        onToggleConnectionMode={() => setIsConnectionModeActive(!isConnectionModeActive)}
      />
    </div>
  );
}
