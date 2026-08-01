import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Trash2, 
  Star, 
  Edit3, 
  ArrowUp, 
  ArrowDown, 
  FileText, 
  Grid,
  Filter
} from 'lucide-react';

export default function PageManagementModal({
  isOpen,
  onClose,
  notebook,
  activePageId,
  onSelectPage,
  onRenamePage,
  onDuplicatePage,
  onDeletePage,
  onToggleFavorite,
  onMovePage
}) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'favorites'

  if (!isOpen) return null;

  const filteredPages = notebook.pages.filter(p => {
    if (filterMode === 'favorites') return p.isFavorite;
    return true;
  });

  const startRename = (page) => {
    setEditingId(page.id);
    setEditTitle(page.title);
  };

  const saveRename = (pageId) => {
    onRenamePage(pageId, editTitle.trim() || 'Untitled Page');
    setEditingId(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#0F172A' }}>Page Management</h2>
            <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>Reorder, rename, duplicate, favorite, or delete notebook pages</p>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button 
            className={`btn-secondary ${filterMode === 'all' ? 'active' : ''}`}
            onClick={() => setFilterMode('all')}
            style={{ fontSize: 12, padding: '4px 12px' }}
          >
            All Pages ({notebook.pages.length})
          </button>
          <button 
            className={`btn-secondary ${filterMode === 'favorites' ? 'active' : ''}`}
            onClick={() => setFilterMode('favorites')}
            style={{ fontSize: 12, padding: '4px 12px' }}
          >
            Favorites ({notebook.pages.filter(p => p.isFavorite).length})
          </button>
        </div>

        {/* Pages List */}
        <div style={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
          {filteredPages.map((page, index) => {
            const isActive = page.id === activePageId;
            return (
              <div 
                key={page.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: isActive ? '#EFF6FF' : '#F8FAFC',
                  border: `1px solid ${isActive ? '#BFDBFE' : '#E2E8F0'}`,
                  transition: 'all 150ms ease'
                }}
              >
                {/* Left: Icon & Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                  {page.type === 'ruled' ? <FileText size={16} color="#2563EB" /> : <Grid size={16} color="#2563EB" />}

                  {editingId === page.id ? (
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ padding: '4px 8px', fontSize: 13, height: 30 }}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => saveRename(page.id)}
                      onKeyDown={(e) => e.key === 'Enter' && saveRename(page.id)}
                      autoFocus
                    />
                  ) : (
                    <span 
                      onClick={() => { onSelectPage(page.id); onClose(); }}
                      style={{ 
                        fontSize: 14, 
                        fontWeight: isActive ? 700 : 500, 
                        color: '#0F172A', 
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {page.title || 'Untitled Page'}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: '#94A3B8', background: '#FFFFFF', padding: '2px 6px', borderRadius: 4 }}>
                    {page.size}
                  </span>
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {/* Favorite Toggle */}
                  <button 
                    className="btn-icon" 
                    onClick={() => onToggleFavorite(page.id)}
                    title={page.isFavorite ? 'Unstar' : 'Star'}
                  >
                    <Star size={14} color={page.isFavorite ? '#F59E0B' : '#94A3B8'} fill={page.isFavorite ? '#F59E0B' : 'none'} />
                  </button>

                  {/* Move Up */}
                  <button 
                    className="btn-icon" 
                    disabled={index === 0} 
                    onClick={() => onMovePage(page.id, 'up')}
                    title="Move Up"
                  >
                    <ArrowUp size={14} />
                  </button>

                  {/* Move Down */}
                  <button 
                    className="btn-icon" 
                    disabled={index === filteredPages.length - 1} 
                    onClick={() => onMovePage(page.id, 'down')}
                    title="Move Down"
                  >
                    <ArrowDown size={14} />
                  </button>

                  {/* Rename */}
                  <button className="btn-icon" onClick={() => startRename(page)} title="Rename">
                    <Edit3 size={14} />
                  </button>

                  {/* Duplicate */}
                  <button className="btn-icon" onClick={() => onDuplicatePage(page.id)} title="Duplicate">
                    <Copy size={14} />
                  </button>

                  {/* Delete */}
                  <button 
                    className="btn-icon" 
                    onClick={() => onDeletePage(page.id)}
                    disabled={notebook.pages.length <= 1}
                    title="Delete Page"
                    style={{ color: '#EF4444' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
