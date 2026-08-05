import React, { useState, useEffect, useRef } from 'react';
import { 
  Type, 
  Bold, 
  Italic, 
  Underline, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  CheckSquare, 
  Undo, 
  Redo, 
  ZoomIn,
  ZoomOut,
  Palette,
  Plus,
  Image as ImageIcon,
  StickyNote,
  FileText,
  Share2,
  Table as TableIcon,
  PenTool,
  Highlighter,
  Eraser,
  LayoutGrid,
  RotateCcw
} from 'lucide-react';

// 15 PREMIUM STUDY PALETTE COLORS
const PREMIUM_COLORS = [
  { name: 'Default', value: 'inherit' },
  { name: 'Black', value: '#0F172A' },
  { name: 'Slate', value: '#475569' },
  { name: 'Gray', value: '#6B7280' },
  { name: 'Blue', value: '#2563EB' },
  { name: 'Royal Blue', value: '#1D4ED8' },
  { name: 'Green', value: '#16A34A' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Orange', value: '#EA580C' },
  { name: 'Amber', value: '#D97706' },
  { name: 'Red', value: '#DC2626' },
  { name: 'Rose', value: '#E11D48' },
  { name: 'Purple', value: '#9333EA' },
  { name: 'Indigo', value: '#4F46E5' },
  { name: 'Teal', value: '#0D9488' },
  { name: 'Brown', value: '#78350F' }
];

export default function Toolbar({
  editor,
  fileFormat = 'md',
  zoom,
  setZoom,
  onInsertImage,
  onAddStickyNote,
  onAddFloatingTextBlock,
  onOpenInsertTableModal,
  isConnectionModeActive,
  onToggleConnectionMode,
  drawingTool = 'none',
  setDrawingTool,
  inkColor = '#0078D4',
  setInkColor,
  onClearCanvasInk,
  onAutoArrangeMindmap
}) {
  const [activePopup, setActivePopup] = useState(null); // 'format' | 'lists' | 'colors' | 'insert' | null
  const [colorSubTab, setColorSubTab] = useState('text'); // 'text' | 'heading'
  const toolbarRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setActivePopup(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) return null;

  const isTxtFormat = fileFormat === 'txt';
  const currentColor = editor.getAttributes('textStyle').color || null;
  const isFormatActive = editor.isActive('bold') || editor.isActive('italic') || editor.isActive('underline') || editor.isActive('heading');
  const isListActive = editor.isActive('bulletList') || editor.isActive('orderedList') || editor.isActive('taskList');

  const handleApplyColor = (colorValue) => {
    if (isTxtFormat) return;
    if (colorValue === 'inherit') {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor(colorValue).run();
    }
  };

  const handleInsertImageClick = () => {
    if (isTxtFormat) {
      alert('Images are supported only in Markdown (.md) notes.');
      return;
    }
    fileInputRef.current?.click();
    setActivePopup(null);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onInsertImage) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onInsertImage(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  return (
    <div className="floating-vertical-toolbar" ref={toolbarRef}>
      {/* Hidden File Input for Single Source Image Upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/png, image/jpeg, image/jpg, image/webp, image/bmp, image/gif"
        style={{ display: 'none' }}
        onChange={handleImageFileChange}
      />

      {/* 1. UNDO / REDO GROUP */}
      <button 
        className="btn-vertical-icon" 
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        <Undo size={18} />
      </button>

      <button 
        className="btn-vertical-icon" 
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Y)"
      >
        <Redo size={18} />
      </button>

      <div className="vertical-divider" />

      {/* 2. FORMATTING GROUP POPUP (Bold, Italic, Underline, H1, H2, H3) */}
      <div style={{ position: 'relative', width: 36, height: 36 }}>
        <button 
          className={`btn-vertical-icon ${isFormatActive || activePopup === 'format' ? 'active' : ''}`}
          onClick={() => setActivePopup(activePopup === 'format' ? null : 'format')}
          title="Formatting (Bold, Italic, Underline, Headings)"
        >
          <Type size={18} />
        </button>

        {activePopup === 'format' && (
          <div className="toolbar-group-popover">
            <div className="popover-section-label">Headings</div>
            <div className="popover-row">
              <button 
                className={`popover-row-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                title="Heading 1"
              >
                <Heading1 size={16} />
              </button>
              <button 
                className={`popover-row-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                title="Heading 2"
              >
                <Heading2 size={16} />
              </button>
              <button 
                className={`popover-row-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                title="Heading 3"
              >
                <Heading3 size={16} />
              </button>
            </div>

            <div className="popover-section-label" style={{ marginTop: 6 }}>Text Style</div>
            <div className="popover-row">
              <button 
                className={`popover-row-btn ${editor.isActive('bold') ? 'active' : ''}`}
                onClick={() => editor.chain().focus().toggleBold().run()}
                title="Bold (Ctrl+B)"
              >
                <Bold size={16} />
              </button>
              <button 
                className={`popover-row-btn ${editor.isActive('italic') ? 'active' : ''}`}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                title="Italic (Ctrl+I)"
              >
                <Italic size={16} />
              </button>
              <button 
                className={`popover-row-btn ${editor.isActive('underline') ? 'active' : ''}`}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                title="Underline (Ctrl+U)"
              >
                <Underline size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. LISTS GROUP POPUP (Bullet, Numbered, Checklist) */}
      <div style={{ position: 'relative', width: 36, height: 36 }}>
        <button 
          className={`btn-vertical-icon ${isListActive || activePopup === 'lists' ? 'active' : ''}`}
          onClick={() => setActivePopup(activePopup === 'lists' ? null : 'lists')}
          title="Lists (Bullet, Numbered, Checklist)"
        >
          <List size={18} />
        </button>

        {activePopup === 'lists' && (
          <div className="toolbar-group-popover wide">
            <button 
              className={`list-popover-item ${editor.isActive('bulletList') ? 'active' : ''}`}
              onClick={() => { editor.chain().focus().toggleBulletList().run(); setActivePopup(null); }}
            >
              <List size={15} />
              <span>Bullet List</span>
            </button>

            <button 
              className={`list-popover-item ${editor.isActive('orderedList') ? 'active' : ''}`}
              onClick={() => { editor.chain().focus().toggleOrderedList().run(); setActivePopup(null); }}
            >
              <ListOrdered size={15} />
              <span>Numbered List</span>
            </button>

            <button 
              className={`list-popover-item ${editor.isActive('taskList') ? 'active' : ''}`}
              onClick={() => { editor.chain().focus().toggleTaskList().run(); setActivePopup(null); }}
            >
              <CheckSquare size={15} />
              <span>Checklist</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. COLORS GROUP POPUP (Text Color & Heading Color) */}
      <div style={{ position: 'relative', width: 36, height: 36 }}>
        <button 
          className={`btn-vertical-icon ${activePopup === 'colors' ? 'active' : ''}`}
          onClick={() => {
            if (isTxtFormat) {
              alert('Text colors are available only in Markdown (.md) notes.');
              return;
            }
            setActivePopup(activePopup === 'colors' ? null : 'colors');
          }}
          disabled={isTxtFormat}
          title={isTxtFormat ? 'Colors available only in Markdown notes' : 'Colors (Text & Heading)'}
          style={{ opacity: isTxtFormat ? 0.4 : 1 }}
        >
          <Palette size={18} color={currentColor || 'var(--accent)'} />
        </button>

        {activePopup === 'colors' && !isTxtFormat && (
          <div className="toolbar-group-popover color-popover">
            <div className="popover-tabs" style={{ display: 'flex', gap: 6, paddingBottom: 6, marginBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>
              <button 
                className={`tab-btn icon-only-tab ${colorSubTab === 'text' ? 'active' : ''}`}
                onClick={() => setColorSubTab('text')}
                title="Text Color"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, height: 30, borderRadius: 6 }}
              >
                <Type size={16} />
              </button>
              <button 
                className={`tab-btn icon-only-tab ${colorSubTab === 'heading' ? 'active' : ''}`}
                onClick={() => setColorSubTab('heading')}
                title="Heading Color"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, height: 30, borderRadius: 6 }}
              >
                <Heading1 size={16} />
              </button>
            </div>

            <div className="color-swatch-grid">
              {PREMIUM_COLORS.map(c => (
                <button
                  key={c.name}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleApplyColor(c.value);
                  }}
                  title={colorSubTab === 'text' ? `Text Color: ${c.name}` : `Heading Color: ${c.name}`}
                  className="color-swatch-btn"
                  style={{
                    background: c.value === 'inherit' ? 'var(--text-primary)' : c.value
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="vertical-divider" />

      {/* 5. INSERT GROUP POPUP (Image, Sticky Note, Text Block) */}
      <div style={{ position: 'relative', width: 36, height: 36 }}>
        <button 
          className={`btn-vertical-icon ${activePopup === 'insert' ? 'active' : ''}`}
          onClick={() => {
            if (isTxtFormat) {
              alert('Floating objects are supported only in Markdown (.md) notes.');
              return;
            }
            setActivePopup(activePopup === 'insert' ? null : 'insert');
          }}
          disabled={isTxtFormat}
          title={isTxtFormat ? 'Insert options available only in Markdown notes' : '+ Insert Object'}
          style={{ opacity: isTxtFormat ? 0.4 : 1 }}
        >
          <Plus size={20} color="var(--accent)" />
        </button>

        {activePopup === 'insert' && !isTxtFormat && (
          <div className="toolbar-group-popover wide">
            <button 
              className="list-popover-item"
              onClick={() => {
                onOpenInsertTableModal && onOpenInsertTableModal();
                setActivePopup(null);
              }}
            >
              <TableIcon size={16} color="#8B5CF6" />
              <span>Insert Table</span>
            </button>

            <button 
              className="list-popover-item"
              onClick={() => {
                onAddFloatingTextBlock && onAddFloatingTextBlock();
                setActivePopup(null);
              }}
            >
              <FileText size={16} color="#0078D4" />
              <span>Floating Text Block</span>
            </button>

            <button 
              className="list-popover-item"
              onClick={() => {
                onAddStickyNote && onAddStickyNote();
                setActivePopup(null);
              }}
            >
              <StickyNote size={16} color="#EA580C" />
              <span>Sticky Note</span>
            </button>

            <button 
              className="list-popover-item"
              onClick={handleInsertImageClick}
            >
              <ImageIcon size={16} color="#10B981" />
              <span>Insert Image</span>
            </button>
          </div>
        )}
      </div>

      <div className="vertical-divider" />

      {/* 6. SAMSUNG NOTES TEXT HIGHLIGHTER & MINDMAP */}
      {/* Samsung Notes Level Text Highlighter Button */}
      <div style={{ position: 'relative', width: 36, height: 36 }}>
        <button 
          className={`btn-vertical-icon ${editor.isActive('highlight') || activePopup === 'highlighter' ? 'active' : ''}`}
          onClick={() => {
            if (isTxtFormat) {
              alert('Text highlighting is supported in Markdown (.md) notes.');
              return;
            }
            if (editor.isActive('highlight')) {
              editor.chain().focus().unsetHighlight().run();
            } else {
              editor.chain().focus().toggleHighlight({ color: '#FEF08A' }).run();
            }
            setActivePopup(activePopup === 'highlighter' ? null : 'highlighter');
          }}
          title="Samsung Notes Text Highlighter"
        >
          <Highlighter size={18} color="#F59E0B" />
        </button>

        {activePopup === 'highlighter' && (
          <div 
            className="toolbar-group-popover color-popover" 
            style={{ width: 150, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Text Highlight Color
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {[
                { name: 'Yellow', color: '#FEF08A' },
                { name: 'Mint', color: '#BBF7D0' },
                { name: 'Sky Blue', color: '#BAE6FD' },
                { name: 'Rose', color: '#FBCFE8' },
                { name: 'Peach', color: '#FED7AA' },
                { name: 'Lavender', color: '#E9D5FF' }
              ].map(item => (
                <button
                  key={item.color}
                  title={item.name}
                  onClick={() => {
                    editor.chain().focus().toggleHighlight({ color: item.color }).run();
                    setActivePopup(null);
                  }}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    backgroundColor: item.color,
                    border: editor.isActive('highlight', { color: item.color }) ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              className="list-popover-item"
              onClick={() => {
                editor.chain().focus().unsetHighlight().run();
                setActivePopup(null);
              }}
              style={{ fontSize: 11, padding: '4px 6px', color: '#EF4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <RotateCcw size={12} color="#EF4444" />
              <span>Clear Highlight</span>
            </button>
          </div>
        )}
      </div>

      {/* Mindmap Tree Button */}
      <div style={{ position: 'relative', width: 36, height: 36 }}>
        <button 
          className="btn-vertical-icon"
          onClick={() => onAutoArrangeMindmap && onAutoArrangeMindmap()}
          title="Auto-Arrange Connected Cards into Mindmap Tree"
        >
          <LayoutGrid size={18} color="var(--accent)" />
        </button>
      </div>
    </div>
  );
}
