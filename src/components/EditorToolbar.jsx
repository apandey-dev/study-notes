import React, { useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Highlighter, 
  Palette, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  List, 
  ListOrdered, 
  CheckSquare, 
  Table as TableIcon, 
  Image as ImageIcon, 
  StickyNote as StickyIcon, 
  Minus, 
  Undo, 
  Redo, 
  ChevronDown,
  Maximize2,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react';

export default function EditorToolbar({ editor, activePage, onAddStickyNote, onChangePageSize }) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  if (!editor) return null;

  const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px'];
  const textColors = ['#0F172A', '#2563EB', '#DC2626', '#16A34A', '#D97706', '#9333EA', '#475569'];
  const highlightColors = ['#FEF08A', '#BBF7D0', '#BAE6FD', '#FBCFE8', '#E9D5FF'];

  const handleImageInsert = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImagePrompt(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          editor.chain().focus().setImage({ src: event.target.result }).run();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="floating-toolbar">
      {/* Undo & Redo */}
      <button 
        className="btn-icon" 
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        <Undo size={16} />
      </button>
      <button 
        className="btn-icon" 
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Y)"
      >
        <Redo size={16} />
      </button>

      <div className="toolbar-divider" />

      {/* Headings */}
      <button 
        className={`btn-icon ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="Heading 1"
      >
        <Heading1 size={16} />
      </button>
      <button 
        className={`btn-icon ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2"
      >
        <Heading2 size={16} />
      </button>
      <button 
        className={`btn-icon ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="Heading 3"
      >
        <Heading3 size={16} />
      </button>

      <div className="toolbar-divider" />

      {/* Text Formatting: Bold, Italic, Underline, Strikethrough */}
      <button 
        className={`btn-icon ${editor.isActive('bold') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)"
      >
        <Bold size={16} />
      </button>

      <button 
        className={`btn-icon ${editor.isActive('italic') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)"
      >
        <Italic size={16} />
      </button>

      <button 
        className={`btn-icon ${editor.isActive('underline') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline (Ctrl+U)"
      >
        <Underline size={16} />
      </button>

      <button 
        className={`btn-icon ${editor.isActive('strike') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <Strikethrough size={16} />
      </button>

      <div className="toolbar-divider" />

      {/* Highlight Color */}
      <div style={{ position: 'relative' }}>
        <button 
          className={`btn-icon ${editor.isActive('highlight') ? 'active' : ''}`}
          onClick={() => setShowHighlightPicker(!showHighlightPicker)}
          title="Highlight Text"
        >
          <Highlighter size={16} />
        </button>

        {showHighlightPicker && (
          <div 
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 6,
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              padding: 8,
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              display: 'flex',
              gap: 6,
              zIndex: 60
            }}
          >
            {highlightColors.map((color) => (
              <div 
                key={color} 
                onClick={() => {
                  editor.chain().focus().toggleHighlight({ color }).run();
                  setShowHighlightPicker(false);
                }}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: color,
                  cursor: 'pointer',
                  border: '1px solid rgba(0,0,0,0.1)'
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Text Color */}
      <div style={{ position: 'relative' }}>
        <button 
          className="btn-icon" 
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Text Color"
        >
          <Palette size={16} />
        </button>

        {showColorPicker && (
          <div 
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 6,
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              padding: 8,
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              display: 'flex',
              gap: 6,
              zIndex: 60
            }}
          >
            {textColors.map((color) => (
              <div 
                key={color} 
                onClick={() => {
                  editor.chain().focus().setColor(color).run();
                  setShowColorPicker(false);
                }}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: color,
                  cursor: 'pointer'
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="toolbar-divider" />

      {/* Alignment */}
      <button 
        className={`btn-icon ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        title="Align Left"
      >
        <AlignLeft size={16} />
      </button>
      <button 
        className={`btn-icon ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        title="Align Center"
      >
        <AlignCenter size={16} />
      </button>
      <button 
        className={`btn-icon ${editor.isActive({ textAlign: 'right' }) ? 'active' : ''}`}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        title="Align Right"
      >
        <AlignRight size={16} />
      </button>
      <button 
        className={`btn-icon ${editor.isActive({ textAlign: 'justify' }) ? 'active' : ''}`}
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        title="Justify"
      >
        <AlignJustify size={16} />
      </button>

      <div className="toolbar-divider" />

      {/* Lists */}
      <button 
        className={`btn-icon ${editor.isActive('bulletList') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        <List size={16} />
      </button>
      <button 
        className={`btn-icon ${editor.isActive('orderedList') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered List"
      >
        <ListOrdered size={16} />
      </button>
      <button 
        className={`btn-icon ${editor.isActive('taskList') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        title="Checklist"
      >
        <CheckSquare size={16} />
      </button>

      <div className="toolbar-divider" />

      {/* Rich Elements: Table, Image, Sticky Note */}
      <button 
        className="btn-icon" 
        onClick={insertTable}
        title="Insert 3x3 Table"
      >
        <TableIcon size={16} />
      </button>

      {/* Image Insert */}
      <div style={{ position: 'relative' }}>
        <button 
          className="btn-icon" 
          onClick={() => setShowImagePrompt(!showImagePrompt)}
          title="Insert Image"
        >
          <ImageIcon size={16} />
        </button>

        {showImagePrompt && (
          <div 
            style={{
              position: 'absolute',
              top: '100%',
              left: -50,
              marginTop: 6,
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 14,
              padding: 12,
              boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
              width: 240,
              zIndex: 60,
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Insert Image</span>
            <input 
              type="text" 
              placeholder="Paste Image URL..." 
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="form-input"
              style={{ padding: '6px 10px', fontSize: 13 }}
            />
            <button className="btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={handleImageInsert}>
              Add URL
            </button>
            <div style={{ textTransform: 'uppercase', fontSize: 10, color: '#94A3B8', textAlign: 'center' }}>or</div>
            <label className="btn-secondary" style={{ padding: '4px 10px', fontSize: 12, justifyContent: 'center', cursor: 'pointer' }}>
              Upload File
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        )}
      </div>

      {/* Sticky Note */}
      <button 
        className="btn-icon" 
        onClick={onAddStickyNote}
        title="Add Floating Sticky Note"
      >
        <StickyIcon size={16} color="#D97706" />
      </button>

      {/* Horizontal Rule */}
      <button 
        className="btn-icon" 
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Line"
      >
        <Minus size={16} />
      </button>

      <div className="toolbar-divider" />

      {/* Page Size Quick Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: 99 }}>
          {activePage.size || 'A4'}
        </span>
      </div>
    </div>
  );
}
