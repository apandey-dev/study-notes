import React, { useState, useEffect, useRef } from 'react';
import { 
  Copy, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Image as ImageIcon,
  Palette
} from 'lucide-react';

const STICKY_COLORS = [
  { name: 'Soft Yellow', value: '#FEF3C7', darkValue: '#3A3212', textLight: '#78350F', textDark: '#FDE68A' },
  { name: 'Soft Blue', value: '#DBEAFE', darkValue: '#1E293B', textLight: '#1E40AF', textDark: '#93C5FD' },
  { name: 'Soft Green', value: '#D1FAE5', darkValue: '#064E3B', textLight: '#065F46', textDark: '#A7F3D0' },
  { name: 'Soft Pink', value: '#FCE7F3', darkValue: '#500724', textLight: '#9D174D', textDark: '#FBCFE8' },
  { name: 'Soft Purple', value: '#EDE9FE', darkValue: '#3B0764', textLight: '#5B21B6', textDark: '#DDD6FE' },
  { name: 'Soft Orange', value: '#FFEDD5', darkValue: '#431407', textLight: '#9A3412', textDark: '#FED7AA' },
  { name: 'White', value: '#FFFFFF', darkValue: '#2D2D30', textLight: '#1F2937', textDark: '#FFFFFF' },
  { name: 'Dark Gray', value: '#374151', darkValue: '#111827', textLight: '#FFFFFF', textDark: '#F3F4F6' }
];

export default function FloatingObjectLayer({
  objects = [],
  onUpdateObjects,
  paperRef,
  fileFormat = 'md'
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [activeColorPopoverId, setActiveColorPopoverId] = useState(null);

  const [dragState, setDragState] = useState(null);
  const [resizeState, setResizeState] = useState(null);

  const layerRef = useRef(null);
  const fileInputRef = useRef(null);

  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

  // Handle autoEdit flag for freshly placed Sticky Notes
  useEffect(() => {
    const autoObj = objects.find(o => o.autoEdit === true);
    if (autoObj) {
      setSelectedId(autoObj.id);
      setEditingId(autoObj.id);
      onUpdateObjects(
        objects.map(o => o.id === autoObj.id ? { ...o, autoEdit: false } : o)
      );
    }
  }, [objects, onUpdateObjects]);

  // Click outside to deselect & exit edit mode
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (layerRef.current && !layerRef.current.contains(e.target) && !e.target.closest('.modal-overlay')) {
        setSelectedId(null);
        setEditingId(null);
        setActiveColorPopoverId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (editingId) {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          setEditingId(null);
        }
        return;
      }

      if (selectedId) {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          setSelectedId(null);
          return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
          e.preventDefault();
          e.stopPropagation();
          handleDuplicateObject(selectedId);
          return;
        }

        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === ']') {
          e.preventDefault();
          e.stopPropagation();
          handleBringForward(selectedId);
          return;
        }

        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '[') {
          e.preventDefault();
          e.stopPropagation();
          handleSendBackward(selectedId);
          return;
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          e.stopPropagation();
          handleDeleteObject(selectedId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, editingId, objects]);

  // Pointer move & up handlers for 60fps smooth dragging and resizing
  useEffect(() => {
    const handlePointerMove = (e) => {
      if (dragState) {
        e.preventDefault();
        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;

        const newX = Math.max(0, dragState.origX + dx);
        const newY = Math.max(0, dragState.origY + dy);

        onUpdateObjects(
          objects.map(obj => obj.id === dragState.id ? { ...obj, x: newX, y: newY } : obj)
        );
      } else if (resizeState) {
        e.preventDefault();
        const dx = e.clientX - resizeState.startX;
        const dy = e.clientY - resizeState.startY;

        let newW = resizeState.origW;
        let newH = resizeState.origH;
        let newX = resizeState.origX;
        let newY = resizeState.origY;

        const isShift = e.shiftKey;
        const aspectRatio = resizeState.origW / resizeState.origH;

        if (resizeState.handle.includes('r')) {
          newW = Math.max(140, resizeState.origW + dx);
        }
        if (resizeState.handle.includes('b')) {
          newH = Math.max(120, resizeState.origH + dy);
        }
        if (resizeState.handle.includes('l')) {
          const possibleW = resizeState.origW - dx;
          if (possibleW >= 140) {
            newW = possibleW;
            newX = resizeState.origX + dx;
          }
        }
        if (resizeState.handle.includes('t')) {
          const possibleH = resizeState.origH - dy;
          if (possibleH >= 120) {
            newH = possibleH;
            newY = resizeState.origY + dy;
          }
        }

        if (!isShift && resizeState.handle.length === 2 && resizeState.type === 'image') {
          newH = Math.round(newW / aspectRatio);
        }

        onUpdateObjects(
          objects.map(obj => obj.id === resizeState.id ? { ...obj, x: newX, y: newY, width: newW, height: newH } : obj)
        );
      }
    };

    const handlePointerUp = () => {
      setDragState(null);
      setResizeState(null);
    };

    if (dragState || resizeState) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, resizeState, objects, onUpdateObjects]);

  // Object Actions
  const handleDeleteObject = (id) => {
    onUpdateObjects(objects.filter(o => o.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (editingId === id) setEditingId(null);
    setActiveColorPopoverId(null);
  };

  const handleDuplicateObject = (id) => {
    const target = objects.find(o => o.id === id);
    if (!target) return;
    const newObj = {
      ...target,
      id: (target.type === 'image' ? 'img_' : 'sticky_') + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      x: target.x + 20,
      y: target.y + 20,
      zIndex: (target.zIndex || 10) + 1
    };
    onUpdateObjects([...objects, newObj]);
    setSelectedId(newObj.id);
  };

  const handleBringForward = (id) => {
    const maxZ = Math.max(...objects.map(o => o.zIndex || 10), 10);
    onUpdateObjects(
      objects.map(o => o.id === id ? { ...o, zIndex: maxZ + 1 } : o)
    );
  };

  const handleSendBackward = (id) => {
    const minZ = Math.min(...objects.map(o => o.zIndex || 10), 10);
    onUpdateObjects(
      objects.map(o => o.id === id ? { ...o, zIndex: Math.max(1, minZ - 1) } : o)
    );
  };

  const handleChangeStickyColor = (id, colorObj) => {
    onUpdateObjects(
      objects.map(o => o.id === id ? { 
        ...o, 
        bgColor: colorObj.value,
        bgDarkColor: colorObj.darkValue,
        textColor: colorObj.textLight,
        textDarkColor: colorObj.textDark
      } : o)
    );
    setActiveColorPopoverId(null);
  };

  const handleReplaceImageClick = (id) => {
    if (fileInputRef.current) {
      fileInputRef.current.dataset.targetId = id;
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const targetId = e.target.dataset.targetId;
    const file = e.target.files?.[0];
    if (file && targetId) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdateObjects(
            objects.map(o => o.id === targetId ? { ...o, src: event.target.result } : o)
          );
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  return (
    <div className="floating-object-overlay-layer" ref={layerRef}>
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {objects.map((obj) => {
        const isSelected = selectedId === obj.id;
        const isEditing = editingId === obj.id;

        const currentBg = isDarkMode 
          ? (obj.bgDarkColor || '#3A3212') 
          : (obj.bgColor || '#FEF3C7');
        const currentTextColor = isDarkMode 
          ? (obj.textDarkColor || '#FDE68A') 
          : (obj.textColor || '#78350F');

        return (
          <div
            key={obj.id}
            className={`floating-object-wrapper ${obj.type === 'text' ? 'sticky-note-card' : ''} ${isSelected ? 'selected' : ''}`}
            style={{
              position: 'absolute',
              left: `${obj.x}px`,
              top: `${obj.y}px`,
              width: `${obj.width}px`,
              height: `${obj.height}px`,
              zIndex: obj.zIndex || 10,
              backgroundColor: obj.type === 'text' ? currentBg : 'transparent',
              borderColor: isSelected ? 'var(--accent)' : 'rgba(0,0,0,0.08)',
              transform: 'translate3d(0,0,0)',
              cursor: isEditing ? 'text' : 'grab'
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setSelectedId(obj.id);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setSelectedId(obj.id);
              if (obj.type === 'text') {
                setEditingId(obj.id);
              }
            }}
          >
            {/* FLOATING ACTION TOOLBAR ABOVE SELECTED OBJECT */}
            {isSelected && (
              <div className="sticky-note-mini-toolbar" onClick={(e) => e.stopPropagation()}>
                {obj.type === 'image' && (
                  <button 
                    className="sticky-toolbar-btn" 
                    onClick={() => handleReplaceImageClick(obj.id)}
                    title="🖼 Replace Image"
                  >
                    <ImageIcon size={14} color="#10B981" />
                  </button>
                )}

                {obj.type === 'text' && (
                  <div style={{ position: 'relative' }}>
                    <button 
                      className="sticky-toolbar-btn" 
                      onClick={() => setActiveColorPopoverId(activeColorPopoverId === obj.id ? null : obj.id)}
                      title="🎨 Background Color"
                    >
                      <Palette size={14} color={currentTextColor} />
                    </button>

                    {activeColorPopoverId === obj.id && (
                      <div className="sticky-color-popover">
                        {STICKY_COLORS.map(c => (
                          <button
                            key={c.name}
                            className="sticky-swatch-btn"
                            style={{ background: isDarkMode ? c.darkValue : c.value }}
                            title={c.name}
                            onClick={() => handleChangeStickyColor(obj.id, c)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button 
                  className="sticky-toolbar-btn" 
                  onClick={() => handleDuplicateObject(obj.id)}
                  title="📋 Duplicate (Ctrl+D)"
                >
                  <Copy size={14} color="#0078D4" />
                </button>

                <button 
                  className="sticky-toolbar-btn" 
                  onClick={() => handleBringForward(obj.id)}
                  title="⬆ Bring Forward (Ctrl+Shift+])"
                >
                  <ArrowUp size={14} />
                </button>

                <button 
                  className="sticky-toolbar-btn" 
                  onClick={() => handleSendBackward(obj.id)}
                  title="⬇ Send Backward (Ctrl+Shift+[)"
                >
                  <ArrowDown size={14} />
                </button>

                <button 
                  className="sticky-toolbar-btn danger" 
                  onClick={() => handleDeleteObject(obj.id)}
                  title="🗑 Delete (Del)"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            {/* STICKY NOTE DRAG BAR */}
            {!isEditing && (
              <div
                className="drag-header-bar"
                title="Drag to move"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setSelectedId(obj.id);
                  setDragState({
                    id: obj.id,
                    startX: e.clientX,
                    startY: e.clientY,
                    origX: obj.x,
                    origY: obj.y
                  });
                }}
              />
            )}

            {/* CONTENT RENDERER: IMAGE OR NATIVE TEXTAREA STICKY NOTE */}
            {obj.type === 'image' ? (
              <img 
                src={obj.src} 
                alt="Floating Asset" 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 6,
                  pointerEvents: 'none',
                  userSelect: 'none',
                  WebkitUserDrag: 'none'
                }} 
              />
            ) : (
              <textarea
                readOnly={!isEditing}
                value={obj.content || ''}
                placeholder="Type your study note here..."
                className={`sticky-note-text-area ${isEditing ? 'editing' : ''}`}
                style={{
                  width: '100%',
                  height: '100%',
                  padding: '12px 14px 14px 14px',
                  outline: 'none',
                  border: 'none',
                  background: 'transparent',
                  resize: 'none',
                  fontFamily: 'var(--font-body)',
                  fontSize: 15,
                  lineHeight: 1.4,
                  color: currentTextColor,
                  overflowY: 'auto',
                  direction: 'ltr',
                  textAlign: 'left',
                  userSelect: isEditing ? 'text' : 'none',
                  cursor: isEditing ? 'text' : 'grab'
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateObjects(
                    objects.map(o => o.id === obj.id ? { ...o, content: val } : o)
                  );
                }}
                onMouseDown={(e) => {
                  if (isEditing) {
                    e.stopPropagation();
                  }
                }}
                onKeyDown={(e) => {
                  if (isEditing) {
                    e.stopPropagation();
                    if (e.key === 'Escape') {
                      setEditingId(null);
                    }
                  }
                }}
              />
            )}

            {/* 8 CUSTOM RESIZE HANDLES */}
            {isSelected && !isEditing && (
              <>
                {['tl', 'tc', 'tr', 'cl', 'cr', 'bl', 'bc', 'br'].map(handle => (
                  <div
                    key={handle}
                    className={`resize-handle handle-${handle}`}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setResizeState({
                        id: obj.id,
                        type: obj.type,
                        handle,
                        startX: e.clientX,
                        startY: e.clientY,
                        origW: obj.width,
                        origH: obj.height,
                        origX: obj.x,
                        origY: obj.y
                      });
                    }}
                  />
                ))}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
