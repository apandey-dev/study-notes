import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { CustomSlashCommands } from '../utils/customSlashCommandsExtension';
import Toolbar from './Toolbar';
import FloatingObjectLayer from './FloatingObjectLayer';
import { 
  Heading1, Heading2, Heading3, Heading4, 
  List, ListOrdered, CheckSquare, 
  Type, Image as ImageIcon, MessageSquare, 
  Code, Calendar, Clock, Minus, AlertTriangle, FileText
} from 'lucide-react';

const SLASH_SUGGESTIONS = [
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

// STATIC EXTENSIONS ARRAY - Defined outside component to prevent reference changes across re-renders
const EDITOR_EXTENSIONS = [
  StarterKit,
  Underline,
  TaskList,
  TaskItem.configure({ nested: true }),
  TextStyle,
  Color,
  CustomSlashCommands
];

export default function EditorCanvas({
  content,
  onContentChange,
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

  // Autocomplete Menu State
  const [slashMenu, setSlashMenu] = useState(null);
  const fileInputRef = useRef(null);

  // Capture initial content & current file key to prevent setContent loop
  const initialContentRef = useRef(content || '');
  const lastLoadedFileKeyRef = useRef(fileKey);

  // TipTap Rich Text Editor Instance - Instantiated EXACTLY ONCE with [] dependencies
  const editor = useEditor({
    extensions: EDITOR_EXTENSIONS,
    editorProps: {
      attributes: {
        dir: 'ltr',
        style: 'direction: ltr !important; text-align: left !important; unicode-bidi: isolate;'
      }
    },
    content: initialContentRef.current,
    autofocus: 'start',
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

      {/* Floating Vertical Toolbar */}
      <Toolbar 
        editor={editor}
        fileFormat={fileFormat}
        zoom={zoom}
        onOpenSearch={onOpenSearch}
        onInsertImage={() => handleOpenNativeImagePicker()}
        onAddStickyNote={handlePrepareInsertStickyNote}
        onAddFloatingTextBlock={handlePrepareInsertTextBlock}
        isConnectionModeActive={isConnectionModeActive}
        onToggleConnectionMode={() => setIsConnectionModeActive(!isConnectionModeActive)}
      />
    </div>
  );
}
