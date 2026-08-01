import React, { useState, useEffect, useRef } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  CheckSquare, 
  Undo, 
  Redo, 
  ZoomIn,
  ZoomOut,
  Palette,
  Tag,
  Image as ImageIcon,
  Type
} from 'lucide-react';

const PALETTE_COLORS = [
  { name: 'Default', value: 'inherit' },
  { name: 'Blue', value: '#0078D4' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Dark Gray', value: '#374151' },
  { name: 'Brown', value: '#B45309' }
];

export default function Toolbar({
  editor,
  fileFormat = 'md',
  zoom,
  setZoom,
  onInsertImage,
  onAddFloatingTextBlock
}) {
  const [activeColorPicker, setActiveColorPicker] = useState(null); // 'text' | 'heading' | null
  const [isListPopoverOpen, setIsListPopoverOpen] = useState(false);
  const toolbarRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setActiveColorPicker(null);
        setIsListPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) return null;

  const isTxtFormat = fileFormat === 'txt';
  const currentColor = editor.getAttributes('textStyle').color || null;
  const isListActive = editor.isActive('bulletList') || editor.isActive('orderedList') || editor.isActive('taskList');

  const handleApplyColor = (colorValue) => {
    if (isTxtFormat) return;
    if (colorValue === 'inherit') {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor(colorValue).run();
    }
    setActiveColorPicker(null);
  };

  const handleInsertImageClick = () => {
    if (isTxtFormat) {
      alert('Images are supported only in Markdown (.md) notes.');
      return;
    }
    fileInputRef.current?.click();
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

      {/* 1. Undo & Redo */}
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

      {/* 2. H1 & H2 */}
      <button 
        className={`btn-vertical-icon ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="Heading 1 (..h1:)"
      >
        <Heading1 size={18} />
      </button>

      <button 
        className={`btn-vertical-icon ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2 (..h2:)"
      >
        <Heading2 size={18} />
      </button>

      <div className="vertical-divider" />

      {/* 3. Bold, Italic, Underline */}
      <button 
        className={`btn-vertical-icon ${editor.isActive('bold') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)"
      >
        <Bold size={18} />
      </button>

      <button 
        className={`btn-vertical-icon ${editor.isActive('italic') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)"
      >
        <Italic size={18} />
      </button>

      <button 
        className={`btn-vertical-icon ${editor.isActive('underline') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline (Ctrl+U)"
      >
        <Underline size={18} />
      </button>

      <div className="vertical-divider" />

      {/* 4. Text Color & Heading Color */}
      <div style={{ position: 'relative', width: 36, height: 36 }}>
        <button 
          className={`btn-vertical-icon ${activeColorPicker === 'text' ? 'active' : ''}`}
          onClick={() => {
            if (isTxtFormat) {
              alert('Text colors are available only in Markdown (.md) notes.');
              return;
            }
            setActiveColorPicker(activeColorPicker === 'text' ? null : 'text');
            setIsListPopoverOpen(false);
          }}
          disabled={isTxtFormat}
          title={isTxtFormat ? 'Text colors are available only in Markdown (.md) notes' : '🎨 Text Color'}
          style={{ opacity: isTxtFormat ? 0.4 : 1, position: 'relative' }}
        >
          <Palette size={18} color={currentColor || '#0078D4'} />
          {currentColor && (
            <span 
              style={{
                position: 'absolute',
                bottom: 3,
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: currentColor
              }}
            />
          )}
        </button>

        {activeColorPicker === 'text' && !isTxtFormat && (
          <div className="color-picker-popover">
            {PALETTE_COLORS.map(c => (
              <button
                key={c.name}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleApplyColor(c.value);
                }}
                title={c.name}
                className="color-swatch-btn"
                style={{
                  background: c.value === 'inherit' ? 'var(--text-primary)' : c.value
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div style={{ position: 'relative', width: 36, height: 36 }}>
        <button 
          className={`btn-vertical-icon ${activeColorPicker === 'heading' ? 'active' : ''}`}
          onClick={() => {
            if (isTxtFormat) {
              alert('Text colors are available only in Markdown (.md) notes.');
              return;
            }
            setActiveColorPicker(activeColorPicker === 'heading' ? null : 'heading');
            setIsListPopoverOpen(false);
          }}
          disabled={isTxtFormat}
          title={isTxtFormat ? 'Heading colors are available only in Markdown (.md) notes' : '🏷 Heading Color'}
          style={{ opacity: isTxtFormat ? 0.4 : 1, position: 'relative' }}
        >
          <Tag size={18} color={currentColor || '#8B5CF6'} />
          {currentColor && (
            <span 
              style={{
                position: 'absolute',
                bottom: 3,
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: currentColor
              }}
            />
          )}
        </button>

        {activeColorPicker === 'heading' && !isTxtFormat && (
          <div className="color-picker-popover">
            {PALETTE_COLORS.map(c => (
              <button
                key={c.name}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleApplyColor(c.value);
                }}
                title={c.name}
                className="color-swatch-btn"
                style={{
                  background: c.value === 'inherit' ? 'var(--text-primary)' : c.value
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="vertical-divider" />

      {/* 5. SINGLE GROUPED "LISTS" BUTTON & POPOVER */}
      <div style={{ position: 'relative', width: 36, height: 36 }}>
        <button 
          className={`btn-vertical-icon ${isListActive || isListPopoverOpen ? 'active' : ''}`}
          onClick={() => {
            setIsListPopoverOpen(!isListPopoverOpen);
            setActiveColorPicker(null);
          }}
          title="Lists (Bullet, Numbered, Checklist)"
        >
          <List size={18} />
        </button>

        {isListPopoverOpen && (
          <div className="list-group-popover">
            <button 
              className={`list-popover-item ${editor.isActive('bulletList') ? 'active' : ''}`}
              onClick={() => { editor.chain().focus().toggleBulletList().run(); setIsListPopoverOpen(false); }}
            >
              <List size={15} />
              <span>Bullet List</span>
              <span className="shortcut-tag">Ctrl+Shift+7</span>
            </button>

            <button 
              className={`list-popover-item ${editor.isActive('orderedList') ? 'active' : ''}`}
              onClick={() => { editor.chain().focus().toggleOrderedList().run(); setIsListPopoverOpen(false); }}
            >
              <ListOrdered size={15} />
              <span>Numbered List</span>
              <span className="shortcut-tag">Ctrl+Shift+8</span>
            </button>

            <button 
              className={`list-popover-item ${editor.isActive('taskList') ? 'active' : ''}`}
              onClick={() => { editor.chain().focus().toggleTaskList().run(); setIsListPopoverOpen(false); }}
            >
              <CheckSquare size={15} />
              <span>Checklist</span>
              <span className="shortcut-tag">Ctrl+Shift+9</span>
            </button>
          </div>
        )}
      </div>

      <div className="vertical-divider" />

      {/* 6. Insert Image Button */}
      <button 
        className="btn-vertical-icon" 
        onClick={handleInsertImageClick}
        disabled={isTxtFormat}
        title={isTxtFormat ? 'Images are supported only in Markdown (.md) notes' : '🖼 Insert Image'}
        style={{ opacity: isTxtFormat ? 0.4 : 1 }}
      >
        <ImageIcon size={18} color={isTxtFormat ? 'var(--text-muted)' : '#10B981'} />
      </button>

      {/* 7. Floating Text Block Button */}
      <button 
        className="btn-vertical-icon" 
        onClick={() => {
          if (isTxtFormat) {
            alert('Floating text blocks are supported only in Markdown (.md) notes.');
            return;
          }
          onAddFloatingTextBlock && onAddFloatingTextBlock();
        }}
        disabled={isTxtFormat}
        title={isTxtFormat ? 'Floating text blocks are supported only in Markdown (.md) notes' : '+ Floating Text'}
        style={{ opacity: isTxtFormat ? 0.4 : 1 }}
      >
        <Type size={18} color={isTxtFormat ? 'var(--text-muted)' : '#0078D4'} />
      </button>

      <div className="vertical-divider" />

      {/* 8. Zoom In & Out */}
      <button 
        className="btn-vertical-icon" 
        onClick={() => setZoom && setZoom(Math.min(160, zoom + 10))}
        title="Zoom In"
      >
        <ZoomIn size={18} />
      </button>

      <button 
        className="btn-vertical-icon" 
        onClick={() => setZoom && setZoom(Math.max(70, zoom - 10))}
        title="Zoom Out"
      >
        <ZoomOut size={18} />
      </button>
    </div>
  );
}
