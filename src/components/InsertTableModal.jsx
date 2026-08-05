import React, { useState } from 'react';
import { X, Table as TableIcon, Check } from 'lucide-react';

export default function InsertTableModal({ isOpen, onClose, onInsert }) {
  const [hoverGrid, setHoverGrid] = useState({ rows: 3, cols: 3 });
  const [withHeader, setWithHeader] = useState(true);

  if (!isOpen) return null;

  const handleSelectGridCell = (r, c) => {
    onInsert({ rows: r, cols: c, withHeaderRow: withHeader });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 99999, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
      <div 
        className="modal-container" 
        style={{ 
          maxWidth: 320, 
          width: '90%',
          padding: '18px 20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 16,
          boxShadow: '0 20px 48px rgba(0,0,0,0.22)',
          animation: 'fadeIn 150ms ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,120,212,0.15)' }}>
              <TableIcon size={16} color="var(--accent)" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, margin: 0, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>Insert Table</h3>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Click cell to insert table</span>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8 }}>
            <X size={15} />
          </button>
        </div>

        {/* Visual Interactive Matrix Grid (8x8 with STRICT 1:1 SQUARE CELLS) */}
        <div style={{ marginBottom: 14, background: 'var(--bg-app)', padding: 12, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Visual Grid Picker</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(0,120,212,0.2)' }}>
              {hoverGrid.rows} × {hoverGrid.cols} Table
            </span>
          </div>

          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(8, 1fr)', 
              gap: 5,
              padding: 2
            }}
            onMouseLeave={() => setHoverGrid({ rows: 3, cols: 3 })}
          >
            {Array.from({ length: 7 }).map((_, rIdx) => {
              const r = rIdx + 1;
              return Array.from({ length: 8 }).map((_, cIdx) => {
                const c = cIdx + 1;
                const isHovered = r <= hoverGrid.rows && c <= hoverGrid.cols;
                return (
                  <div
                    key={`${r}-${c}`}
                    onMouseEnter={() => setHoverGrid({ rows: r, cols: c })}
                    onClick={() => handleSelectGridCell(r, c)}
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1', // STRICT 1:1 SQUARE RATIO
                      borderRadius: 4,
                      border: '1px solid',
                      borderColor: isHovered ? 'var(--accent)' : 'var(--border-subtle)',
                      backgroundColor: isHovered ? 'var(--accent)' : 'var(--bg-card)',
                      boxShadow: isHovered ? '0 2px 6px rgba(0,120,212,0.3)' : 'none',
                      opacity: isHovered ? 0.95 : 0.65,
                      cursor: 'pointer',
                      transition: 'all 100ms ease',
                      transform: isHovered ? 'scale(1.06)' : 'scale(1)'
                    }}
                  />
                );
              });
            })}
          </div>
        </div>

        {/* Header Row Checkbox */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            marginBottom: 14, 
            padding: '8px 12px',
            borderRadius: 8,
            background: 'var(--bg-app)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer' 
          }} 
          onClick={() => setWithHeader(!withHeader)}
        >
          <input 
            type="checkbox" 
            checked={withHeader} 
            onChange={() => {}} 
            style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--accent)' }}
          />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', userSelect: 'none' }}>Include Header Row</span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            className="btn-compact" 
            onClick={onClose}
            style={{ height: 32, padding: '0 14px', borderRadius: 8, fontSize: 12 }}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn-compact-primary"
            onClick={() => handleSelectGridCell(hoverGrid.rows, hoverGrid.cols)}
            style={{ height: 32, padding: '0 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600 }}
          >
            <Check size={14} />
            <span>Insert {hoverGrid.rows}×{hoverGrid.cols}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
