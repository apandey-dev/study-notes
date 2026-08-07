import React, { useState, useEffect, useRef } from 'react';

const PALETTE_COLORS = [
  { name: 'Primary Text', value: 'var(--color-text-primary)', color: 'var(--color-text-primary)', tooltip: 'Primary Text' },
  { name: 'Secondary Text', value: 'var(--color-text-secondary)', color: 'var(--color-text-secondary)', tooltip: 'Secondary Text' },
  { name: 'Blue', value: 'var(--color-accent-blue)', color: 'var(--color-accent-blue)', tooltip: 'Accent Blue' },
  { name: 'Green', value: 'var(--color-accent-green)', color: 'var(--color-accent-green)', tooltip: 'Accent Green' },
  { name: 'Orange', value: 'var(--color-accent-orange)', color: 'var(--color-accent-orange)', tooltip: 'Accent Orange' },
  { name: 'Purple', value: 'var(--color-accent-purple)', color: 'var(--color-accent-purple)', tooltip: 'Accent Purple' },
  { name: 'Red', value: '#DC2626', color: '#DC2626', tooltip: 'Pure Red' },
  { name: 'Yellow', value: '#FBCF33', color: '#FBCF33', tooltip: 'Yellow' },
  { name: 'Brown', value: '#78350F', color: '#78350F', tooltip: 'Brown' },
  { name: 'Cyan', value: 'var(--color-accent-cyan)', color: 'var(--color-accent-cyan)', tooltip: 'Cyan' }
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

  const R = 54; // Radial distance from center

  // Restrict to viewport boundaries
  let adjustedX = anchorPos.x;
  let adjustedY = anchorPos.y;
  const padding = 75; // buffer for R + button size

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
    editor.chain().focus().setColor(colorObj.value).run();
    onClose();
  };

  const getCenterColor = () => {
    if (hoveredIndex !== null) {
      return PALETTE_COLORS[hoveredIndex].color;
    }
    if (activeIndex !== null) {
      return PALETTE_COLORS[activeIndex].color;
    }
    return editor.getAttributes('textStyle').color || 'var(--color-text-primary)';
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
        {/* Non-clickable Center Live Color Preview */}
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: getCenterColor(),
            border: '1px solid var(--border-subtle)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
            pointerEvents: 'none',
            transition: 'background-color 150ms ease, background 150ms ease'
          }}
        />

        {/* Circular Color Swatches */}
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
              aria-label={item.tooltip}
              style={{
                position: 'absolute',
                left: `calc(50% + ${targetX}px)`,
                top: `calc(50% + ${targetY}px)`,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: item.color,
                border: isCurrentActive 
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
            />
          );
        })}
      </div>
    </div>
  );
}
