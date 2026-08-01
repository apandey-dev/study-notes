import React, { useState } from 'react';
import { X, Check, FileText, Layout } from 'lucide-react';

export default function CreateNoteModal({ isOpen, onClose, onCreate }) {
  const [fileName, setFileName] = useState('');
  const [format, setFormat] = useState('md'); // 'md' or 'txt'
  const [noteType, setNoteType] = useState('ruled'); // 'ruled' or 'blank'
  const [pageSize, setPageSize] = useState('A4');
  const [customWidth, setCustomWidth] = useState(800);
  const [customHeight, setCustomHeight] = useState(1000);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      fileName: fileName.trim() || 'Untitled_Study_Note',
      format,
      noteType,
      pageSize,
      customWidth: Number(customWidth),
      customHeight: Number(customHeight)
    });
    setFileName('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', margin: 0 }}>Create Study Note</h2>
          <button className="btn-compact" style={{ width: 28, height: 28, padding: 0 }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* File Name */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4B5563', marginBottom: 6 }}>
              File Name
            </label>
            <input 
              type="text" 
              className="input-compact" 
              style={{ height: 34, fontSize: 14 }}
              placeholder="e.g., Organic_Chemistry_Ch1"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Format Selection (.md vs .txt) */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4B5563', marginBottom: 6 }}>
              File Format (System File)
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                type="button"
                className={`btn-compact ${format === 'md' ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center', height: 34 }}
                onClick={() => setFormat('md')}
              >
                .md (Markdown)
              </button>
              <button 
                type="button"
                className={`btn-compact ${format === 'txt' ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center', height: 34 }}
                onClick={() => setFormat('txt')}
              >
                .txt (Plain Text)
              </button>
            </div>
          </div>

          {/* Note Type (Ruled vs Blank Page background visual aid) */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4B5563', marginBottom: 6 }}>
              Page Style (Visual Aid)
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                type="button"
                className={`btn-compact ${noteType === 'ruled' ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center', height: 34 }}
                onClick={() => setNoteType('ruled')}
              >
                <FileText size={14} color="#0078D4" />
                <span>Ruled Page</span>
              </button>
              <button 
                type="button"
                className={`btn-compact ${noteType === 'blank' ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center', height: 34 }}
                onClick={() => setNoteType('blank')}
              >
                <Layout size={14} color="#0078D4" />
                <span>Blank Page</span>
              </button>
            </div>
            <span style={{ fontSize: 11, color: '#9CA3AF', display: 'block', marginTop: 4 }}>
              Note background only. Does not modify actual text file contents.
            </span>
          </div>

          {/* Page Size Preset */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4B5563', marginBottom: 6 }}>
              Page Size
            </label>
            <select 
              className="input-compact" 
              style={{ height: 34, fontSize: 13 }}
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value)}
            >
              <option value="A4">A4 Paper (794 × 1123 px)</option>
              <option value="A5">A5 Paper (559 × 794 px)</option>
              <option value="Letter">US Letter (816 × 1056 px)</option>
              <option value="Legal">US Legal (816 × 1344 px)</option>
              <option value="Custom">Custom Dimensions</option>
            </select>
          </div>

          {pageSize === 'Custom' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: '#4B5563' }}>Width (px)</label>
                <input 
                  type="number" 
                  className="input-compact" 
                  value={customWidth} 
                  onChange={(e) => setCustomWidth(e.target.value)} 
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#4B5563' }}>Height (px)</label>
                <input 
                  type="number" 
                  className="input-compact" 
                  value={customHeight} 
                  onChange={(e) => setCustomHeight(e.target.value)} 
                />
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button type="button" className="btn-compact" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-compact-primary" style={{ height: 34, padding: '0 16px', fontSize: 13 }}>
              <Check size={14} />
              <span>Create Note</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
