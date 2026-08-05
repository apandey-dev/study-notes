import React, { useState } from 'react';
import { X, Table as TableIcon, Check, Plus, Minus } from 'lucide-react';

export default function InsertTableModal({ isOpen, onClose, onInsert }) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [hoverGrid, setHoverGrid] = useState({ rows: 3, cols: 3 });
  const [withHeader, setWithHeader] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const r = Math.max(1, Math.min(20, parseInt(rows) || 3));
    const c = Math.max(1, Math.min(20, parseInt(cols) || 3));
    onInsert({ rows: r, cols: c, withHeaderRow: withHeader });
    onClose();
  };

  const handleSelectGridCell = (r, c) => {
    setRows(r);
    setCols(c);
    onInsert({ rows: r, cols: c, withHeaderRow: withHeader });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 99999 }}>
      <div 
        className="modal-container" 
        style={{ 
          maxWidth: 340, 
          padding: '16px 20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 14,
          boxShadow: '0 16px 36px rgba(0,0,0,0.18)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TableIcon size={16} color="var(--accent)" />
            </div>
            <div>
              <h3 style={{ fontSize: 14, margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>Insert Table</h3>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Choose size or click grid</span>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ width: 26, height: 26, borderRadius: 6 }}>
            <X size={14} />
          </button>
        </div>

        {/* Visual Interactive Compact Grid Picker (6x6) */}
        <div style={{ marginBottom: 12, background: 'var(--border-light)', padding: 10, borderRadius: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Quick Grid</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', padding: '1px 6px', borderRadius: 4 }}>
              {hoverGrid.rows} × {hoverGrid.cols}
            </span>
          </div>

          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(6, 1fr)', 
              gap: 4,
              padding: 2
            }}
            onMouseLeave={() => setHoverGrid({ rows, cols })}
          >
            {Array.from({ length: 5 }).map((_, rIdx) => {
              const r = rIdx + 1;
              return Array.from({ length: 6 }).map((_, cIdx) => {
                const c = cIdx + 1;
                const isHovered = r <= hoverGrid.rows && c <= hoverGrid.cols;
                return (
                  <div
                    key={`${r}-${c}`}
                    onMouseEnter={() => setHoverGrid({ rows: r, cols: c })}
                    onClick={() => handleSelectGridCell(r, c)}
                    style={{
                      height: 18,
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: isHovered ? 'var(--accent)' : 'var(--border-subtle)',
                      backgroundColor: isHovered ? 'var(--accent)' : 'var(--bg-card)',
                      opacity: isHovered ? 0.9 : 0.6,
                      cursor: 'pointer',
                      transition: 'all 100ms ease'
                    }}
                  />
                );
              });
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Row & Column Stepper Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {/* Rows Control */}
            <div style={{ background: 'var(--bg-app)', padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
                Rows
              </label>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button 
                  type="button" 
                  className="btn-titlebar-icon"
                  style={{ width: 22, height: 22, borderRadius: 4, background: 'var(--bg-card)' }}
                  onClick={() => setRows(Math.max(1, rows - 1))}
                >
                  <Minus size={11} />
                </button>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{rows}</span>
                <button 
                  type="button" 
                  className="btn-titlebar-icon"
                  style={{ width: 22, height: 22, borderRadius: 4, background: 'var(--bg-card)' }}
                  onClick={() => setRows(Math.min(20, rows + 1))}
                >
                  <Plus size={11} />
                </button>
              </div>
            </div>

            {/* Columns Control */}
            <div style={{ background: 'var(--bg-app)', padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
                Cols
              </label>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button 
                  type="button" 
                  className="btn-titlebar-icon"
                  style={{ width: 22, height: 22, borderRadius: 4, background: 'var(--bg-card)' }}
                  onClick={() => setCols(Math.max(1, cols - 1))}
                >
                  <Minus size={11} />
                </button>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{cols}</span>
                <button 
                  type="button" 
                  className="btn-titlebar-icon"
                  style={{ width: 22, height: 22, borderRadius: 4, background: 'var(--bg-card)' }}
                  onClick={() => setCols(Math.min(20, cols + 1))}
                >
                  <Plus size={11} />
                </button>
              </div>
            </div>
          </div>

          {/* Header Row Checkbox */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              marginBottom: 14, 
              padding: '6px 10px',
              borderRadius: 6,
              background: 'var(--bg-app)',
              cursor: 'pointer' 
            }} 
            onClick={() => setWithHeader(!withHeader)}
          >
            <input 
              type="checkbox" 
              checked={withHeader} 
              onChange={() => {}} 
              style={{ width: 14, height: 14, cursor: 'pointer', accentColor: 'var(--accent)' }}
            />
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', userSelect: 'none' }}>Header Row</span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn-compact" 
              onClick={onClose}
              style={{ height: 30, padding: '0 12px', borderRadius: 6, fontSize: 12 }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-compact-primary"
              style={{ height: 30, padding: '0 14px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600 }}
            >
              <Check size={13} />
              <span>Insert {rows}×{cols}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
