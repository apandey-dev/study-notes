import React from 'react';
import { BookOpen, Loader2 } from 'lucide-react';

export default function LoadingScreen({ message = 'Initializing Study Notebook...' }) {
  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        background: 'var(--bg-app, #FAFAFA)',
        color: 'var(--text-primary, #1F2937)',
        userSelect: 'none'
      }}
    >
      <div 
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'var(--accent-light, #EFF6FF)',
          border: '1px solid var(--accent, #0078D4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16
        }}
      >
        <BookOpen size={28} color="#0078D4" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--text-secondary, #4B5563)' }}>
        <Loader2 size={16} className="spin" color="#0078D4" />
        <span>{message}</span>
      </div>
    </div>
  );
}
