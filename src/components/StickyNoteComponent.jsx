import React, { useState } from 'react';
import { X, Palette } from 'lucide-react';

export default function StickyNoteComponent({ note, onUpdate, onDelete }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showPalette, setShowPalette] = useState(false);

  const colors = ['yellow', 'blue', 'green', 'pink', 'purple'];

  const handleMouseDown = (e) => {
    // Avoid drag when editing text inside textarea
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON') return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - note.x,
      y: e.clientY - note.y
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      onUpdate(note.id, {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={`sticky-note ${note.color || 'yellow'}`}
      style={{
        left: `${note.x}px`,
        top: `${note.y}px`
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <button 
          className="btn-icon" 
          style={{ width: 22, height: 22, padding: 0 }} 
          onClick={() => setShowPalette(!showPalette)}
          title="Change Color"
        >
          <Palette size={12} />
        </button>

        <button 
          className="btn-icon" 
          style={{ width: 22, height: 22, padding: 0 }} 
          onClick={() => onDelete(note.id)}
          title="Delete Sticky Note"
        >
          <X size={12} />
        </button>
      </div>

      {showPalette && (
        <div 
          style={{
            display: 'flex',
            gap: 4,
            marginBottom: 8,
            background: 'rgba(255,255,255,0.7)',
            padding: 4,
            borderRadius: 8
          }}
        >
          {colors.map((c) => (
            <div
              key={c}
              onClick={() => {
                onUpdate(note.id, { color: c });
                setShowPalette(false);
              }}
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                cursor: 'pointer',
                border: '1px solid rgba(0,0,0,0.1)'
              }}
              className={`sticky-note ${c}`}
            />
          ))}
        </div>
      )}

      <textarea
        value={note.content}
        onChange={(e) => onUpdate(note.id, { content: e.target.value })}
        placeholder="Type a sticky note..."
        style={{
          width: '100%',
          height: 90,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          resize: 'none',
          fontFamily: 'Playpen Sans, cursive, sans-serif',
          fontSize: 13,
          color: 'inherit'
        }}
      />
    </div>
  );
}
