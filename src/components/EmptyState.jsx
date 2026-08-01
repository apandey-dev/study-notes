import React from 'react';
import { Plus, BookOpen, Sparkles } from 'lucide-react';

export default function EmptyState({ onOpenNewPageModal }) {
  return (
    <div 
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        textAlign: 'center',
        background: 'radial-gradient(circle at 50% 30%, #F1F5F9 0%, #FAFAFA 70%)'
      }}
    >
      {/* Visual SVG Graphic */}
      <div 
        style={{
          width: 120,
          height: 120,
          borderRadius: 32,
          background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          boxShadow: '0 20px 40px rgba(37, 99, 235, 0.12)',
          border: '1px solid #BFDBFE'
        }}
      >
        <BookOpen size={56} color="#2563EB" />
      </div>

      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
        Create your first page
      </h2>
      
      <p style={{ fontSize: 14, color: '#64748B', maxWidth: 360, marginBottom: 28, lineHeight: 1.5 }}>
        Start writing with a Ruled Notebook Page or a completely Blank White Canvas with custom paper dimensions.
      </p>

      <button 
        className="btn-primary" 
        style={{ padding: '12px 28px', fontSize: 16, borderRadius: 999 }}
        onClick={onOpenNewPageModal}
      >
        <Plus size={20} />
        <span>New Page</span>
      </button>
    </div>
  );
}
