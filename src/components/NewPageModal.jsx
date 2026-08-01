import React, { useState } from 'react';
import { X, FileText, Grid, Check, Sparkles } from 'lucide-react';
import { PAGE_SIZES } from '../utils/notebookStorage';

export default function NewPageModal({ isOpen, onClose, onCreatePage }) {
  const [pageName, setPageName] = useState('');
  const [pageType, setPageType] = useState('ruled'); // 'ruled' or 'blank'
  const [pageSize, setPageSize] = useState('A4');
  const [customWidth, setCustomWidth] = useState(800);
  const [customHeight, setCustomHeight] = useState(1000);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreatePage({
      title: pageName.trim() || 'Untitled Page',
      type: pageType,
      size: pageSize,
      customWidth: Number(customWidth),
      customHeight: Number(customHeight)
    });
    setPageName('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div 
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#0F172A' }}>Create New Page</h2>
              <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>Configure page background & paper dimensions</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Page Name Input */}
          <div className="form-group">
            <label className="form-label">Page Name</label>
            <input 
              type="text"
              className="form-input"
              placeholder="e.g., Weekly Plan, Lecture Notes..."
              value={pageName}
              onChange={(e) => setPageName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Page Type Selector (Ruled vs Blank) */}
          <div className="form-group">
            <label className="form-label">Page Type (Permanent Background)</label>
            <div className="page-type-selector">
              {/* Ruled Page */}
              <div 
                className={`page-type-card ${pageType === 'ruled' ? 'selected' : ''}`}
                onClick={() => setPageType('ruled')}
              >
                <div className="page-type-preview ruled" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 14 }}>
                  <FileText size={15} color="#2563EB" />
                  <span>Ruled Page</span>
                </div>
                <span style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                  Notebook lines & spacing
                </span>
              </div>

              {/* Blank Page */}
              <div 
                className={`page-type-card ${pageType === 'blank' ? 'selected' : ''}`}
                onClick={() => setPageType('blank')}
              >
                <div className="page-type-preview blank" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 14 }}>
                  <Grid size={15} color="#2563EB" />
                  <span>Blank Page</span>
                </div>
                <span style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                  Completely white canvas
                </span>
              </div>
            </div>
          </div>

          {/* Paper Size Preset */}
          <div className="form-group">
            <label className="form-label">Paper Size Preset</label>
            <select 
              className="form-select"
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value)}
            >
              {Object.entries(PAGE_SIZES).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Size Inputs */}
          {pageSize === 'Custom' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <label className="form-label">Custom Width (px)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={customWidth} 
                  onChange={(e) => setCustomWidth(e.target.value)} 
                  min="400" 
                  max="2000"
                />
              </div>
              <div>
                <label className="form-label">Custom Height (px)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={customHeight} 
                  onChange={(e) => setCustomHeight(e.target.value)} 
                  min="400" 
                  max="3000"
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Check size={16} />
              <span>Create Page</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
