import React, { useState, useEffect, useRef } from 'react';
import { Palette, X } from 'lucide-react';

const PALETTE_COLORS = [
  { name: 'Primary', value: 'var(--color-text-primary)', color: 'var(--text-primary)', tooltip: 'Primary Text' },
  { name: 'Secondary', value: 'var(--color-text-secondary)', color: 'var(--text-secondary)', tooltip: 'Secondary Text' },
  { name: 'Blue', value: 'var(--color-accent-blue)', color: '#0078D4', tooltip: 'Accent Blue' },
  { name: 'Green', value: 'var(--color-accent-green)', color: '#10B981', tooltip: 'Accent Green' },
  { name: 'Orange', value: 'var(--color-accent-orange)', color: '#F59E0B', tooltip: 'Accent Orange' },
  { name: 'Purple', value: 'var(--color-accent-purple)', color: '#8B5CF6', tooltip: 'Accent Purple' },
  { name: 'Pink', value: '#EC4899', color: '#EC4899', tooltip: 'Pink' },
  { name: 'Red', value: '#DC2626', color: '#DC2626', tooltip: 'Pure Red' },
  { name: 'Yellow', value: '#FBCF33', color: '#FBCF33', tooltip: 'Yellow' },
  { name: 'Gray', value: '#6B7280', color: '#6B7280', tooltip: 'Gray' },
  { name: 'Reset', value: 'inherit', color: 'transparent', tooltip: 'Reset to Default', isReset: true },
  { name: 'Custom', value: 'custom', color: 'linear-gradient(45deg, red, orange, yellow, green, blue, purple)', tooltip: 'Custom Color', isCustom: true }
];

export default function FloatingRadialColorPalette({
  editor,
  isOpen,
  onClose,
  anchorPos
}) {
  const [animate, setAnimate] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

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
        setActiveIndex(prev => (prev === null ? 0 : (prev + 1) % PALETTE_COLORS.length));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev === null ? PALETTE_COLORS.length - 1 : (prev - 1 + PALETTE_COLORS.length) % PALETTE_COLORS.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex !== null) {
          applyColor(PALETTE_COLORS[activeIndex]);
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

  const R = 60; // Radial distance from center

  // Restrict to viewport boundaries
  let adjustedX = anchorPos.x;
  let adjustedY = anchorPos.y;
  const padding = 85; // buffer for R + button size

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

  const applyColor = (colorObj) => {
    if (colorObj.isReset) {
      editor.chain().focus().unsetColor().run();
      onClose();
    } else if (colorObj.isCustom) {
      // Trigger color input click
      fileInputRef.current?.click();
    } else {
      editor.chain().focus().setColor(colorObj.value).run();
      onClose();
    }
  };

  const handleCustomColorChange = (e) => {
    const customCol = e.target.value;
    if (customCol) {
      editor.chain().focus().setColor(customCol).run();
    }
    onClose();
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
      {/* Hidden native color input for Custom option */}
      <input 
        type="color" 
        ref={fileInputRef} 
        style={{ display: 'none' }}
        onChange={handleCustomColorChange}
      />

      {/* Main radial popup container */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 44,
          height: 44,
          transform: 'translate(-50%, -50%)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '50%',
          boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          userSelect: 'none'
        }}
      >
        {/* Central Core Indicator */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--bg-editor)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
            cursor: 'pointer',
            transition: 'all 120ms ease'
          }}
          onClick={onClose}
          title="Close Palette"
        >
          {hoveredIndex !== null || activeIndex !== null ? (
            <span 
              style={{ 
                fontSize: 8, 
                fontWeight: 800, 
                textAlign: 'center', 
                color: 'var(--accent)',
                lineHeight: 1.1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 28,
                textTransform: 'uppercase'
              }}
            >
              {PALETTE_COLORS[hoveredIndex !== null ? hoveredIndex : activeIndex].name}
            </span>
          ) : (
            <Palette size={14} color="var(--text-secondary)" />
          )}
        </div>

        {/* Color Swatches */}
        {PALETTE_COLORS.map((item, i) => {
          const angle = (i * 360) / PALETTE_COLORS.length;
          const angleRad = (angle * Math.PI) / 180;
          const targetX = animate ? R * Math.cos(angleRad) : 0;
          const targetY = animate ? R * Math.sin(angleRad) : 0;
          const isCurrentActive = activeIndex === i;

          return (
            <button
              key={item.name}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => applyColor(item)}
              title={item.tooltip}
              style={{
                position: 'absolute',
                left: `calc(50% + ${targetX}px)`,
                top: `calc(50% + ${targetY}px)`,
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: item.color,
                border: item.isReset 
                  ? '2px dashed var(--border-subtle)' 
                  : isCurrentActive 
                    ? '2.5px solid var(--accent)' 
                    : '1.5px solid var(--border-subtle)',
                boxShadow: isCurrentActive 
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
              {item.isReset && (
                <X size={10} color="var(--text-secondary)" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
