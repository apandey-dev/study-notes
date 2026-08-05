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
          maxWidth: 420, 
          padding: '22px 26px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 16,
          boxShadow: '0 20px 40px rgba(0,0,0,0.18)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TableIcon size={20} color="var(--accent)" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>Insert Table</h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Choose table size or click grid</span>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8 }}>
            <X size={16} />
          </button>
        </div>

        {/* Visual Interactive Grid Picker (8x8) */}
        <div style={{ marginBottom: 18, background: 'var(--border-light)', padding: 14, borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Quick Grid Selector</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', padding: '2px 8px', borderRadius: 6 }}>
              {hoverGrid.rows} Rows × {hoverGrid.cols} Columns
            </span>
          </div>

          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(8, 1fr)', 
              gap: 5,
              padding: 4
            }}
            onMouseLeave={() => setHoverGrid({ rows, cols })}
          >
            {Array.from({ length: 6 }).map((_, rIdx) => {
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
                      height: 24,
                      borderRadius: 4,
                      border: '1px solid',
                      borderColor: isHovered ? 'var(--accent)' : 'var(--border-subtle)',
                      backgroundColor: isHovered ? 'var(--accent)' : 'var(--bg-card)',
                      opacity: isHovered ? 0.9 : 0.6,
                      cursor: 'pointer',
                      transition: 'all 120ms ease'
                    }}
                  />
                );
              });
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Row & Column Stepper Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {/* Rows Control */}
            <div style={{ background: 'var(--bg-app)', padding: 10, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Rows
              </label>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button 
                  type="button" 
                  className="btn-titlebar-icon"
                  style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg-card)' }}
                  onClick={() => setRows(Math.max(1, rows - 1))}
                >
                  <Minus size={13} />
                </button>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{rows}</span>
                <button 
                  type="button" 
                  className="btn-titlebar-icon"
                  style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg-card)' }}
                  onClick={() => setRows(Math.min(20, rows + 1))}
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>

            {/* Columns Control */}
            <div style={{ background: 'var(--bg-app)', padding: 10, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Columns
              </label>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button 
                  type="button" 
                  className="btn-titlebar-icon"
                  style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg-card)' }}
                  onClick={() => setCols(Math.max(1, cols - 1))}
                >
                  <Minus size={13} />
                </button>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{cols}</span>
                <button 
                  type="button" 
                  className="btn-titlebar-icon"
                  style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg-card)' }}
                  onClick={() => setCols(Math.min(20, cols + 1))}
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Header Row Checkbox */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 10, 
              marginBottom: 20, 
              padding: '8px 12px',
              borderRadius: 8,
              background: 'var(--bg-app)',
              cursor: 'pointer' 
            }} 
            onClick={() => setWithHeader(!withHeader)}
          >
            <input 
              type="checkbox" 
              checked={withHeader} 
              onChange={() => {}} 
              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent)' }}
            />
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', userSelect: 'none' }}>Include Header Row</span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn-compact" 
              onClick={onClose}
              style={{ height: 36, padding: '0 16px', borderRadius: 8 }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-compact-primary"
              style={{ height: 36, padding: '0 18px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
            >
              <Check size={15} />
              <span>Insert {rows}×{cols} Table</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
