import React, { useState, useEffect, useRef } from 'react';
import { X, Highlighter } from 'lucide-react';

const HIGHLIGHT_PALETTE = [
  { name: 'Yellow', value: 'var(--highlight-yellow)', color: 'var(--highlight-yellow)', tooltip: 'Soft Yellow' },
  { name: 'Green', value: 'var(--highlight-green)', color: 'var(--highlight-green)', tooltip: 'Mint Green' },
  { name: 'Blue', value: 'var(--highlight-blue)', color: 'var(--highlight-blue)', tooltip: 'Sky Blue' },
  { name: 'Pink', value: 'var(--highlight-pink)', color: 'var(--highlight-pink)', tooltip: 'Soft Pink' },
  { name: 'Peach', value: 'var(--highlight-peach)', color: 'var(--highlight-peach)', tooltip: 'Peach' },
  { name: 'Purple', value: 'var(--highlight-purple)', color: 'var(--highlight-purple)', tooltip: 'Lavender' },
  { name: 'Clear', value: 'clear', color: 'transparent', tooltip: 'Clear Highlight', isClear: true }
];

export default function FloatingRadialHighlightPalette({
  editor,
  isOpen,
  onClose,
  anchorPos
}) {
  const [animate, setAnimate] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const containerRef = useRef(null);

  // Keyboard navigation & Close on click outside
  useEffect(() => {
    if (!isOpen) {
      setAnimate(false);
      setActiveIndex(null);
      return;
    }

    const timer = setTimeout(() => setAnimate(true), 20);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev === null ? 0 : (prev + 1) % HIGHLIGHT_PALETTE.length));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev === null ? HIGHLIGHT_PALETTE.length - 1 : (prev - 1 + HIGHLIGHT_PALETTE.length) % HIGHLIGHT_PALETTE.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex !== null) {
          applyHighlight(HIGHLIGHT_PALETTE[activeIndex]);
        }
      }
    };

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, activeIndex, onClose]);

  if (!isOpen || !anchorPos || !editor) return null;

  const R = 54; // Radial distance from center

  // Restrict to viewport boundaries
  let adjustedX = anchorPos.x;
  let adjustedY = anchorPos.y;
  const padding = 75;

  if (adjustedX - padding < 0) {
    adjustedX = padding;
  } else if (adjustedX + padding > window.innerWidth) {
    adjustedX = window.innerWidth - padding;
  }

  if (adjustedY - padding < 0) {
    adjustedY = padding;
  } else if (adjustedY + padding > window.innerHeight) {
    adjustedY = window.innerHeight - padding;
  }

  const applyHighlight = (item) => {
    if (item.isClear) {
      editor.chain().focus().unsetHighlight().run();
      onClose();
    } else {
      // Check if already active with the same color (Toggle behavior)
      const isActive = editor.isActive('highlight', { color: item.value });
      if (isActive) {
        editor.chain().focus().unsetHighlight().run();
      } else {
        editor.chain().focus().setHighlight({ color: item.value }).run();
      }
      onClose();
    }
  };

  const getCenterColor = () => {
    if (hoveredIndex !== null) {
      return HIGHLIGHT_PALETTE[hoveredIndex].color;
    }
    if (activeIndex !== null) {
      return HIGHLIGHT_PALETTE[activeIndex].color;
    }
    // Return editor's active highlight color or transparent
    return editor.getAttributes('highlight').color || 'transparent';
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        left: adjustedX,
        top: adjustedY,
        width: 1,
        height: 1,
        zIndex: 500,
        pointerEvents: 'auto'
      }}
    >
      {/* Main radial popup container */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 44,
          height: 44,
          transform: `translate(-50%, -50%) scale(${animate ? 1 : 0.85})`,
          opacity: animate ? 1 : 0,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '50%',
          boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          userSelect: 'none',
          transition: 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease'
        }}
      >
        {/* Center Live Preview (Non-clickable) */}
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: getCenterColor(),
            border: '1px solid var(--border-subtle)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 150ms ease, background 150ms ease'
          }}
        >
          {getCenterColor() === 'transparent' && (
            <Highlighter size={12} color="var(--text-muted)" />
          )}
        </div>

        {/* Highlight Swatches */}
        {HIGHLIGHT_PALETTE.map((item, i) => {
          const angle = (i * 360) / HIGHLIGHT_PALETTE.length;
          const angleRad = (angle * Math.PI) / 180;
          const targetX = animate ? R * Math.cos(angleRad) : 0;
          const targetY = animate ? R * Math.sin(angleRad) : 0;
          const isCurrentActive = activeIndex === i;
          const isHighlightApplied = !item.isClear && editor.isActive('highlight', { color: item.value });

          return (
            <button
              key={item.name}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => applyHighlight(item)}
              title={item.tooltip}
              aria-label={item.tooltip}
              style={{
                position: 'absolute',
                left: `calc(50% + ${targetX}px)`,
                top: `calc(50% + ${targetY}px)`,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: item.color,
                border: isCurrentActive || isHighlightApplied
                  ? '2.5px solid var(--accent)' 
                  : '1.5px solid var(--border-subtle)',
                boxShadow: isCurrentActive || isHighlightApplied
                  ? '0 0 8px var(--accent)' 
                  : '0 2px 5px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transform: `translate(-50%, -50%) scale(${animate ? 1 : 0})`,
                opacity: animate ? 1 : 0,
                transition: 'left 220ms cubic-bezier(0.34, 1.56, 0.64, 1), top 220ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 180ms ease, opacity 180ms ease, border-color 150ms ease, box-shadow 150ms ease',
                transitionDelay: `${i * 12}ms`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                outline: 'none'
              }}
            >
              {item.isClear && (
                <X size={10} color="var(--text-secondary)" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
