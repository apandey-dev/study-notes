import React, { useState } from 'react';
import { X, FileText, Grid, Check } from 'lucide-react';
import { setDefaultPageType } from '../utils/recentNotes';

export default function ChoosePageTypeModal({ isOpen, onClose, onConfirm }) {
  const [selectedType, setSelectedType] = useState('ruled');
  const [rememberChoice, setRememberChoice] = useState(false);

  if (!isOpen) return null;

  const handleContinue = () => {
    if (rememberChoice) {
      setDefaultPageType(selectedType);
    }
    onConfirm(selectedType);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Choose Page Type</h2>
          <button className="btn-compact" style={{ width: 28, height: 28, padding: 0 }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          The opened file is empty. Select a visual background for writing notes:
        </p>

        {/* Options */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div 
            className={`btn-compact ${selectedType === 'ruled' ? 'active' : ''}`}
            style={{ height: 60, flexDirection: 'column', justifyContent: 'center', borderRadius: 10 }}
            onClick={() => setSelectedType('ruled')}
          >
            <FileText size={18} color="#0078D4" />
            <span style={{ fontWeight: 600, marginTop: 4 }}>Ruled Page</span>
          </div>

          <div 
            className={`btn-compact ${selectedType === 'blank' ? 'active' : ''}`}
            style={{ height: 60, flexDirection: 'column', justifyContent: 'center', borderRadius: 10 }}
            onClick={() => setSelectedType('blank')}
          >
            <Grid size={18} color="#0078D4" />
            <span style={{ fontWeight: 600, marginTop: 4 }}>Blank Page</span>
          </div>
        </div>

        {/* Remember my choice checkbox */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <input 
            type="checkbox" 
            id="rememberChoice"
            checked={rememberChoice}
            onChange={(e) => setRememberChoice(e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <label htmlFor="rememberChoice" style={{ fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            Remember my choice for future empty notes
          </label>
        </div>

        {/* Footer Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn-compact" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-compact-primary" style={{ height: 34, padding: '0 16px', fontSize: 13 }} onClick={handleContinue}>
            <Check size={14} />
            <span>Continue</span>
          </button>
        </div>
      </div>
    </div>
  );
}
