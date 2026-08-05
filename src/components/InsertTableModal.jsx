import React, { useState } from 'react';
import { X, Table as TableIcon, Check } from 'lucide-react';

export default function InsertTableModal({ isOpen, onClose, onInsert }) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [withHeader, setWithHeader] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const r = Math.max(1, Math.min(20, parseInt(rows) || 3));
    const c = Math.max(1, Math.min(20, parseInt(cols) || 3));
    onInsert({ rows: r, cols: c, withHeaderRow: withHeader });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-container" 
        style={{ maxWidth: 380, padding: '20px 24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TableIcon size={18} color="var(--accent)" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>Insert Table</h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Choose table dimensions</span>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ width: 28, height: 28 }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Row Count Input */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Number of Rows (1-20)
            </label>
            <input 
              type="number" 
              min="1" 
              max="20" 
              value={rows} 
              onChange={(e) => setRows(e.target.value)}
              className="modal-input"
              style={{ width: '100%', height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Column Count Input */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Number of Columns (1-20)
            </label>
            <input 
              type="number" 
              min="1" 
              max="20" 
              value={cols} 
              onChange={(e) => setCols(e.target.value)}
              className="modal-input"
              style={{ width: '100%', height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Header Row Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer' }} onClick={() => setWithHeader(!withHeader)}>
            <input 
              type="checkbox" 
              checked={withHeader} 
              onChange={() => {}} 
              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent)' }}
            />
            <span style={{ fontSize: 13, color: 'var(--text-primary)', userSelect: 'none' }}>Include Header Row</span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn-compact" 
              onClick={onClose}
              style={{ height: 34, padding: '0 14px' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-compact-primary"
              style={{ height: 34, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Check size={14} />
              <span>Insert Table</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
