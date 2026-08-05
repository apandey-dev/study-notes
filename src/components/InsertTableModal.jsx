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
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 99999, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
      <div 
        className="modal-container" 
        style={{ 
          maxWidth: 360, 
          width: '90%',
          padding: '20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 16,
          boxShadow: '0 20px 48px rgba(0,0,0,0.22)',
          animation: 'fadeIn 150ms ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,120,212,0.15)' }}>
              <TableIcon size={18} color="var(--accent)" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, margin: 0, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>Insert Table</h3>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Hover matrix or set custom size</span>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8 }}>
            <X size={15} />
          </button>
        </div>

        {/* Visual Interactive Matrix Grid (6x6 with PERFECT 1:1 SQUARE CELLS) */}
        <div style={{ marginBottom: 16, background: 'var(--bg-app)', padding: 12, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Matrix Selection</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(0,120,212,0.2)' }}>
              {hoverGrid.rows} × {hoverGrid.cols} Table
            </span>
          </div>

          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(6, 1fr)', 
              gap: 6,
              padding: 2
            }}
            onMouseLeave={() => setHoverGrid({ rows, cols })}
          >
            {Array.from({ length: 6 }).map((_, rIdx) => {
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
                      width: '100%',
                      aspectRatio: '1 / 1', // STRICT 1:1 SQUARE RATIO (Equal Width & Height)
                      borderRadius: 5,
                      border: '1px solid',
                      borderColor: isHovered ? 'var(--accent)' : 'var(--border-subtle)',
                      backgroundColor: isHovered ? 'var(--accent)' : 'var(--bg-card)',
                      boxShadow: isHovered ? '0 2px 6px rgba(0,120,212,0.3)' : 'none',
                      opacity: isHovered ? 0.95 : 0.65,
                      cursor: 'pointer',
                      transition: 'all 120ms ease',
                      transform: isHovered ? 'scale(1.04)' : 'scale(1)'
                    }}
                  />
                );
              });
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Row & Column Stepper Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {/* Rows Control Card */}
            <div style={{ background: 'var(--bg-app)', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.5px' }}>
                Rows
              </label>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button 
                  type="button" 
                  className="btn-titlebar-icon"
                  style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                  onClick={() => { const val = Math.max(1, rows - 1); setRows(val); setHoverGrid({ rows: val, cols }); }}
                >
                  <Minus size={12} />
                </button>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{rows}</span>
                <button 
                  type="button" 
                  className="btn-titlebar-icon"
                  style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                  onClick={() => { const val = Math.min(20, rows + 1); setRows(val); setHoverGrid({ rows: val, cols }); }}
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>

            {/* Columns Control Card */}
            <div style={{ background: 'var(--bg-app)', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.5px' }}>
                Columns
              </label>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button 
                  type="button" 
                  className="btn-titlebar-icon"
                  style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                  onClick={() => { const val = Math.max(1, cols - 1); setCols(val); setHoverGrid({ rows, cols: val }); }}
                >
                  <Minus size={12} />
                </button>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{cols}</span>
                <button 
                  type="button" 
                  className="btn-titlebar-icon"
                  style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                  onClick={() => { const val = Math.min(20, cols + 1); setCols(val); setHoverGrid({ rows, cols: val }); }}
                >
                  <Plus size={12} />
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
              marginBottom: 16, 
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
              style={{ height: 34, padding: '0 14px', borderRadius: 8, fontSize: 12 }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-compact-primary"
              style={{ height: 34, padding: '0 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}
            >
              <Check size={14} />
              <span>Insert {rows}×{cols} Table</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
