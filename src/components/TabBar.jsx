import React from 'react';
import { FileText, FileCode, X, Plus } from 'lucide-react';

export default function TabBar({
  openTabs = [],
  activeTabPath,
  onSelectTab,
  onCloseTab,
  onNewTab
}) {
  if (openTabs.length === 0) return null;

  return (
    <div 
      className="multi-tab-bar no-drag" 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: '4px 8px 0 8px',
        background: 'var(--bg-app)',
        borderBottom: '1px solid var(--border-subtle)',
        overflowX: 'auto',
        userSelect: 'none',
        height: 36
      }}
    >
      {openTabs.map(tab => {
        const isActive = tab.path === activeTabPath;
        const isMd = tab.format === 'md';

        return (
          <div
            key={tab.path || tab.name}
            className={`workspace-tab ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(tab)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px 4px 10px',
              borderRadius: '8px 8px 0 0',
              background: isActive ? 'var(--bg-card)' : 'transparent',
              border: isActive ? '1px solid var(--border-subtle)' : '1px solid transparent',
              borderBottom: isActive ? '1px solid var(--bg-card)' : '1px solid transparent',
              marginBottom: isActive ? -1 : 0,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              transition: 'all 120ms ease',
              maxWidth: 180,
              minWidth: 90
            }}
          >
            {isMd ? <FileText size={13} color="#0078D4" /> : <FileCode size={13} color="#10B981" />}
            <span 
              style={{ 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                flex: 1
              }}
              title={tab.name}
            >
              {tab.name}
            </span>
            <button
              className="btn-titlebar-icon"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab);
              }}
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                opacity: 0.7,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close Tab"
            >
              <X size={11} />
            </button>
          </div>
        );
      })}

      {/* New Tab Button */}
      <button
        className="btn-titlebar-icon"
        onClick={onNewTab}
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          marginLeft: 4,
          opacity: 0.8
        }}
        title="Open / Create Note Tab"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}
