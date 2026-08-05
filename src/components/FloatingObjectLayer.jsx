import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { getBezierPath, getSmoothStepPath, getStraightPath, Position } from '@xyflow/react';
import { 
  Copy, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Image as ImageIcon,
  Palette,
  Maximize2,
  Minimize2,
  Edit3,
  ArrowRight,
  Tag,
  Spline,
  Minus,
  Square,
  PenTool,
  Highlighter,
  Eraser,
  LayoutGrid,
  Sparkles,
  RotateCcw
} from 'lucide-react';

// SOFT PAPER-LIKE STICKY NOTE PALETTE (10 low-saturation study colors)
const STICKY_COLORS = [
  { name: 'Soft Yellow', value: '#FEF9C3', darkValue: '#383214', textLight: '#713F12', textDark: '#FEF08A' },
  { name: 'Warm Cream', value: '#FEF3C7', darkValue: '#3B2F17', textLight: '#78350F', textDark: '#FDE68A' },
  { name: 'Pastel Blue', value: '#E0F2FE', darkValue: '#192E3E', textLight: '#075985', textDark: '#BAE6FD' },
  { name: 'Mint Green', value: '#DCFCE7', darkValue: '#173724', textLight: '#166534', textDark: '#BBF7D0' },
  { name: 'Lavender', value: '#F3E8FF', darkValue: '#311F42', textLight: '#6B21A8', textDark: '#E9D5FF' },
  { name: 'Peach', value: '#FFEDD5', darkValue: '#3D2214', textLight: '#9A3412', textDark: '#FED7AA' },
  { name: 'Soft Pink', value: '#FCE7F3', darkValue: '#3C1A29', textLight: '#9D174D', textDark: '#FBCFE8' },
  { name: 'Light Gray', value: '#F3F4F6', darkValue: '#27272A', textLight: '#374151', textDark: '#E5E7EB' },
  { name: 'Ivory', value: '#FAFAF9', darkValue: '#2C2B2A', textLight: '#44403C', textDark: '#F5F5F4' },
  { name: 'Sage', value: '#E2E8F0', darkValue: '#232D35', textLight: '#334155', textDark: '#CBD5E1' }
];

// MUTED PROFESSIONAL KNOWLEDGE GRAPH PALETTE
const CONNECTION_COLORS = [
  { name: 'Slate', value: '#64748B' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Gray', value: '#334155' }
];

// Helper to calculate exact connection anchor coordinates on boundary
function getHandleCoords(obj, handleName) {
  if (!obj) return { x: 0, y: 0, position: Position.Top };
  const w = obj.width || 200;
  const h = obj.height || 150;
  const x = obj.x || 0;
  const y = obj.y || 0;

  switch (handleName) {
    case 'top':
      return { x: x + w / 2, y: y, position: Position.Top };
    case 'bottom':
      return { x: x + w / 2, y: y + h, position: Position.Bottom };
    case 'left':
      return { x: x, y: y + h / 2, position: Position.Left };
    case 'right':
      return { x: x + w, y: y + h / 2, position: Position.Right };
    default:
      return { x: x + w / 2, y: y, position: Position.Top };
  }
}

// SMART AUTO-ANCHORING: Dynamic optimal handle pair selection based on object positions
function getSmartHandlePair(fromObj, toObj) {
  if (!fromObj || !toObj) return { fromHandle: 'right', toHandle: 'left' };

  const fromCenter = { x: fromObj.x + (fromObj.width || 200) / 2, y: fromObj.y + (fromObj.height || 150) / 2 };
  const toCenter = { x: toObj.x + (toObj.width || 200) / 2, y: toObj.y + (toObj.height || 150) / 2 };

  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;

  let fromHandle = 'right';
  let toHandle = 'left';

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) {
      fromHandle = 'right';
      toHandle = 'left';
    } else {
      fromHandle = 'left';
      toHandle = 'right';
    }
  } else {
    if (dy > 0) {
      fromHandle = 'bottom';
      toHandle = 'top';
    } else {
      fromHandle = 'top';
      toHandle = 'bottom';
    }
  }

  return { fromHandle, toHandle };
}

// Sub-component for Rich Text Floating Text Block using TipTap
function TextBlockEditorContent({ content, isEditing, onContentChange, containerRef }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color
    ],
    content: content || '<p>Floating Text Block</p>',
    editable: isEditing,
    onUpdate: ({ editor: currentEditor }) => {
      onContentChange(currentEditor.getHTML());

      if (!isEditing) return;

      const { selection } = currentEditor.state;
      const { $from } = selection;
      const parentNode = $from.parent;

      if (parentNode && parentNode.isTextblock && parentNode.textContent === '/') {
        const fromPos = $from.start();
        const toPos = $from.end();
        currentEditor.chain()
          .focus()
          .deleteRange({ from: fromPos, to: toPos })
          .setHeading({ level: 1 })
          .run();
      }
    }
  }, []);

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.setEditable(isEditing);
    }
  }, [editor, isEditing]);

  useEffect(() => {
    if (editor && !editor.isDestroyed && content !== editor.getHTML() && !isEditing) {
      editor.commands.setContent(content || '<p>Floating Text Block</p>');
    }
  }, [content, editor, isEditing]);

  return (
    <div className="text-block-editor-inner" ref={containerRef}>
      <EditorContent editor={editor} />
    </div>
  );
}

export default function FloatingObjectLayer({
  objects = [],
  onUpdateObjects,
  isConnectionModeActive = false,
  onToggleConnectionMode,
  drawingTool = 'none',
  setDrawingTool,
  inkColor = '#0078D4',
  setInkColor,
  refApi
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState(null);
  const [activeColorPopoverId, setActiveColorPopoverId] = useState(null);
  const [activeConnPopover, setActiveConnPopover] = useState(null); // 'style' | 'arrow' | null
  const [editingLabelId, setEditingLabelId] = useState(null);

  const [dragState, setDragState] = useState(null);
  const [resizeState, setResizeState] = useState(null);
  const [connectingState, setConnectingState] = useState(null);
  const [hoveredObjectId, setHoveredObjectId] = useState(null);

  const [contextMenu, setContextMenu] = useState(null); // { x, y, id }

  // FREEHAND INK / DRAWING STATES
  const [isDrawing, setIsDrawing] = useState(false);
  const drawingCanvasRef = useRef(null);

  // AUTO-ARRANGE MINDMAP TREE LAYOUT ALGORITHM
  const handleAutoArrangeMindmap = () => {
    if (cards.length === 0) return;

    const inDegree = {};
    const childrenMap = {};
    cards.forEach(c => {
      inDegree[c.id] = 0;
      childrenMap[c.id] = [];
    });

    connections.forEach(conn => {
      if (inDegree[conn.toId] !== undefined) {
        inDegree[conn.toId]++;
      }
      if (childrenMap[conn.fromId]) {
        childrenMap[conn.fromId].push(conn.toId);
      }
    });

    let rootIds = cards.filter(c => inDegree[c.id] === 0).map(c => c.id);
    if (rootIds.length === 0) rootIds = [cards[0].id];

    const levels = {};
    const queue = rootIds.map(id => ({ id, level: 0 }));
    const visited = new Set();

    while (queue.length > 0) {
      const { id, level } = queue.shift();
      if (visited.has(id)) continue;
      visited.add(id);

      if (!levels[level]) levels[level] = [];
      levels[level].push(id);

      const children = childrenMap[id] || [];
      children.forEach(childId => {
        if (!visited.has(childId)) {
          queue.push({ id: childId, level: level + 1 });
        }
      });
    }

    cards.forEach(c => {
      if (!visited.has(c.id)) {
        if (!levels[0]) levels[0] = [];
        levels[0].push(c.id);
      }
    });

    const newPositions = {};
    const centerY = 260;

    Object.keys(levels).forEach(lvlStr => {
      const lvl = parseInt(lvlStr);
      const nodeIds = levels[lvl];
      const count = nodeIds.length;
      const verticalGap = 190;
      const totalHeight = (count - 1) * verticalGap;
      const startY = centerY - (totalHeight / 2);
      const startX = 80 + lvl * 320;

      nodeIds.forEach((nodeId, idx) => {
        newPositions[nodeId] = {
          x: startX,
          y: Math.max(60, startY + idx * verticalGap)
        };
      });
    });

    onUpdateObjects(
      objects.map(o => newPositions[o.id] ? { ...o, x: newPositions[o.id].x, y: newPositions[o.id].y } : o)
    );
  };

  useEffect(() => {
    if (refApi) {
      refApi.current = {
        autoArrangeMindmap: handleAutoArrangeMindmap
      };
    }
  }, [refApi]);

  const layerRef = useRef(null);
  const fileInputRef = useRef(null);
  const textBlockRefs = useRef({});

  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

  const cards = objects.filter(o => o && o.type !== 'connection');
  const connections = objects.filter(o => o && o.type === 'connection');

  // Handle autoEdit flag
  useEffect(() => {
    const autoObj = cards.find(o => o.autoEdit === true);
    if (autoObj) {
      setSelectedId(autoObj.id);
      setEditingId(autoObj.id);
      onUpdateObjects(
        objects.map(o => o.id === autoObj.id ? { ...o, autoEdit: false } : o)
      );
    }
  }, [cards, objects, onUpdateObjects]);

  // Click outside listener
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (e.target.closest('.floating-context-menu') || e.target.closest('.connection-property-toolbar') || e.target.closest('.conn-popover-menu')) {
        return;
      }

      if (layerRef.current && !layerRef.current.contains(e.target) && !e.target.closest('.modal-overlay')) {
        setSelectedId(null);
        setEditingId(null);
        setSelectedConnectionId(null);
        setActiveColorPopoverId(null);
        setActiveConnPopover(null);
        setEditingLabelId(null);
      }

      setContextMenu(null);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Object Actions
  const handleDeleteObject = useCallback((id) => {
    onUpdateObjects(objects.filter(o => o.id !== id && o.fromId !== id && o.toId !== id));
    if (selectedId === id) setSelectedId(null);
    if (editingId === id) setEditingId(null);
    if (selectedConnectionId === id) setSelectedConnectionId(null);
    setActiveColorPopoverId(null);
    setContextMenu(null);
  }, [objects, onUpdateObjects, selectedId, editingId, selectedConnectionId]);

  const handleDuplicateObject = useCallback((id) => {
    const target = cards.find(o => o.id === id);
    if (!target) return;
    const prefix = target.type === 'image' ? 'img_' : (target.type === 'textBlock' ? 'tb_' : 'sticky_');
    const newObj = {
      ...target,
      id: prefix + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      x: target.x + 20,
      y: target.y + 20,
      zIndex: (target.zIndex || 10) + 1
    };
    onUpdateObjects([...objects, newObj]);
    setSelectedId(newObj.id);
    setSelectedConnectionId(null);
    setContextMenu(null);
  }, [cards, objects, onUpdateObjects]);

  const handleBringForward = useCallback((id) => {
    const maxZ = Math.max(...cards.map(o => o.zIndex || 10), 10);
    onUpdateObjects(
      objects.map(o => o.id === id ? { ...o, zIndex: maxZ + 1 } : o)
    );
    setContextMenu(null);
  }, [cards, objects, onUpdateObjects]);

  const handleSendBackward = useCallback((id) => {
    const minZ = Math.min(...cards.map(o => o.zIndex || 10), 10);
    onUpdateObjects(
      objects.map(o => o.id === id ? { ...o, zIndex: Math.max(1, minZ - 1) } : o)
    );
    setContextMenu(null);
  }, [cards, objects, onUpdateObjects]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (editingId || editingLabelId) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setEditingId(null);
          setEditingLabelId(null);
        }
        return;
      }

      if (contextMenu && e.key === 'Escape') {
        e.preventDefault();
        setContextMenu(null);
        return;
      }

      if (isConnectionModeActive && e.key === 'Escape') {
        e.preventDefault();
        onToggleConnectionMode && onToggleConnectionMode();
        setConnectingState(null);
        return;
      }

      if (selectedConnectionId) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          onUpdateObjects(objects.filter(o => o.id !== selectedConnectionId));
          setSelectedConnectionId(null);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setSelectedConnectionId(null);
          return;
        }
      }

      if (selectedId) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setSelectedId(null);
          setContextMenu(null);
          return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
          e.preventDefault();
          handleDuplicateObject(selectedId);
          return;
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          handleDeleteObject(selectedId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, editingId, editingLabelId, contextMenu, selectedConnectionId, isConnectionModeActive, objects, handleDeleteObject, handleDuplicateObject, onToggleConnectionMode, onUpdateObjects]);

  // Pointer move & up handlers for dragging, resizing, AND drag-connecting
  useEffect(() => {
    const handlePointerMove = (e) => {
      if (connectingState) {
        e.preventDefault();
        const layerRect = layerRef.current?.getBoundingClientRect();
        if (layerRect) {
          const currX = (e.clientX - layerRect.left);
          const currY = (e.clientY - layerRect.top);
          setConnectingState(prev => prev ? { ...prev, currentX: currX, currentY: currY } : null);
        }
      } else if (dragState) {
        e.preventDefault();
        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;
        const newX = Math.max(0, dragState.origX + dx);
        const newY = Math.max(0, dragState.origY + dy);
        onUpdateObjects(
          objects.map(obj => obj.id === dragState.id ? { ...obj, x: newX, y: newY } : obj)
        );
      } else if (resizeState) {
        e.preventDefault();
        const dx = e.clientX - resizeState.startX;
        const dy = e.clientY - resizeState.startY;

        let newW = resizeState.origW;
        let newH = resizeState.origH;
        let newX = resizeState.origX;
        let newY = resizeState.origY;
        let newFontSize = resizeState.origFontSize || 16;

        const isCorner = ['tl', 'tr', 'bl', 'br'].includes(resizeState.handle);

        if (resizeState.handle.includes('r')) newW = Math.max(120, resizeState.origW + dx);
        if (resizeState.handle.includes('b')) newH = Math.max(80, resizeState.origH + dy);
        if (resizeState.handle.includes('l')) {
          const possibleW = resizeState.origW - dx;
          if (possibleW >= 120) {
            newW = possibleW;
            newX = resizeState.origX + dx;
          }
        }
        if (resizeState.handle.includes('t')) {
          const possibleH = resizeState.origH - dy;
          if (possibleH >= 80) {
            newH = possibleH;
            newY = resizeState.origY + dy;
          }
        }

        if (resizeState.type === 'image' && isCorner) {
          const aspectRatio = resizeState.origW / resizeState.origH;
          newH = Math.round(newW / aspectRatio);
        }

        if (resizeState.type === 'textBlock' && isCorner) {
          const widthRatio = newW / resizeState.origW;
          newFontSize = Math.max(10, Math.min(120, Math.round(resizeState.origFontSize * widthRatio)));
        }

        onUpdateObjects(
          objects.map(obj => obj.id === resizeState.id ? { 
            ...obj, 
            x: newX, 
            y: newY, 
            width: newW, 
            height: newH,
            fontSize: newFontSize
          } : obj)
        );
      }
    };

    const handlePointerUp = (e) => {
      if (connectingState) {
        const layerRect = layerRef.current?.getBoundingClientRect();
        if (layerRect) {
          const releaseX = e.clientX - layerRect.left;
          const releaseY = e.clientY - layerRect.top;

          const targetCard = cards.find(c => 
            c.id !== connectingState.fromId &&
            releaseX >= c.x - 15 && releaseX <= c.x + c.width + 15 &&
            releaseY >= c.y - 15 && releaseY <= c.y + c.height + 15
          );

          if (targetCard) {
            const fromCard = cards.find(c => c.id === connectingState.fromId);
            const smartPair = getSmartHandlePair(fromCard, targetCard);

            const newConn = {
              id: 'conn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
              type: 'connection',
              fromId: connectingState.fromId,
              fromHandle: connectingState.fromHandle || smartPair.fromHandle,
              toId: targetCard.id,
              toHandle: smartPair.toHandle,
              lineType: 'bezier',
              color: '#64748B',
              thickness: 2,
              lineStyle: 'solid',
              arrow: 'none',
              label: ''
            };

            onUpdateObjects([...objects, newConn]);
            setSelectedConnectionId(newConn.id);
            setSelectedId(null);

            // AUTO-EXIT Connection Mode as requested!
            onToggleConnectionMode && onToggleConnectionMode();
          }
        }
        setConnectingState(null);
      }
      setDragState(null);
      setResizeState(null);
    };

    if (dragState || resizeState || connectingState) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, resizeState, connectingState, cards, objects, onToggleConnectionMode, onUpdateObjects]);

  const handleAutoSize = (id) => {
    const el = textBlockRefs.current[id];
    if (el) {
      const newW = Math.max(180, Math.min(600, el.scrollWidth + 24));
      const newH = Math.max(100, Math.min(800, el.scrollHeight + 24));
      onUpdateObjects(
        objects.map(o => o.id === id ? { ...o, width: newW, height: newH } : o)
      );
    }
    setContextMenu(null);
  };

  const handleResetImageSize = (id) => {
    onUpdateObjects(
      objects.map(o => o.id === id ? { ...o, width: 320, height: 220 } : o)
    );
    setContextMenu(null);
  };

  const handleChangeStickyColor = (id, colorObj) => {
    onUpdateObjects(
      objects.map(o => o.id === id ? { 
        ...o, 
        bgColor: colorObj.value,
        bgDarkColor: colorObj.darkValue,
        textColor: colorObj.textLight,
        textDarkColor: colorObj.textDark
      } : o)
    );
    setActiveColorPopoverId(null);
  };

  const handleReplaceImageClick = (id) => {
    if (fileInputRef.current) {
      fileInputRef.current.dataset.targetId = id;
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const targetId = e.target.dataset.targetId;
    const file = e.target.files?.[0];
    if (file && targetId) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdateObjects(
            objects.map(o => o.id === targetId ? { ...o, src: event.target.result } : o)
          );
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Start Connection Handle Drag
  const handleStartConnectDrag = (e, cardId, handleName) => {
    e.stopPropagation();
    e.preventDefault();
    const cardObj = cards.find(c => c.id === cardId);
    if (!cardObj) return;
    const coords = getHandleCoords(cardObj, handleName);
    const layerRect = layerRef.current?.getBoundingClientRect();

    setConnectingState({
      fromId: cardId,
      fromHandle: handleName,
      startX: coords.x,
      startY: coords.y,
      currentX: layerRect ? e.clientX - layerRect.left : coords.x,
      currentY: layerRect ? e.clientY - layerRect.top : coords.y
    });
  };

  // Update selected connection property
  const handleUpdateConnectionProp = (connId, key, value) => {
    onUpdateObjects(
      objects.map(o => o.id === connId ? { ...o, [key]: value } : o)
    );
  };

  const selectedConnectionObj = connections.find(c => c.id === selectedConnectionId);

  // Compute center position of selected connection line for property toolbar anchor
  let toolbarLeft = 0;
  let toolbarTop = 0;
  if (selectedConnectionObj) {
    const fObj = cards.find(c => c.id === selectedConnectionObj.fromId);
    const tObj = cards.find(c => c.id === selectedConnectionObj.toId);
    if (fObj && tObj) {
      const smartPair = getSmartHandlePair(fObj, tObj);
      const srcCoords = getHandleCoords(fObj, smartPair.fromHandle);
      const tgtCoords = getHandleCoords(tObj, smartPair.toHandle);
      toolbarLeft = (srcCoords.x + tgtCoords.x) / 2;
      toolbarTop = (srcCoords.y + tgtCoords.y) / 2;
    }
  }

  return (
    <div 
      className={`floating-object-overlay-layer ${isConnectionModeActive ? 'connection-mode-active' : ''}`} 
      ref={layerRef}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* SVG CONNECTIONS RENDER LAYER */}
      <svg className="connections-svg-layer">
        <defs>
          {CONNECTION_COLORS.map(c => (
            <React.Fragment key={c.value}>
              <marker
                id={`arrow-end-${c.value.replace('#', '')}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={c.value} />
              </marker>
              <marker
                id={`arrow-start-${c.value.replace('#', '')}`}
                viewBox="0 0 10 10"
                refX="2"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 10 0 L 0 5 L 10 10 z" fill={c.value} />
              </marker>
            </React.Fragment>
          ))}
        </defs>

        {/* EXISTING CONNECTIONS */}
        {connections.map((conn) => {
          const fromObj = cards.find(c => c.id === conn.fromId);
          const toObj = cards.find(c => c.id === conn.toId);
          if (!fromObj || !toObj) return null;

          // Preserve user handle choice if present, otherwise use smart pair
          const fromHandle = conn.fromHandle || smartPair.fromHandle;
          const toHandle = conn.toHandle || smartPair.toHandle;
          const srcCoords = getHandleCoords(fromObj, fromHandle);
          const tgtCoords = getHandleCoords(toObj, toHandle);

          // Check if any third card intersects the path area between src and tgt
          const doesIntersectOtherNode = cards.some(c => {
            if (c.id === fromObj.id || c.id === toObj.id) return false;
            const minX = Math.min(srcCoords.x, tgtCoords.x);
            const maxX = Math.max(srcCoords.x, tgtCoords.x);
            const minY = Math.min(srcCoords.y, tgtCoords.y);
            const maxY = Math.max(srcCoords.y, tgtCoords.y);
            const cX = c.x + (c.width || 200) / 2;
            const cY = c.y + (c.height || 150) / 2;
            return (cX >= minX - 30 && cX <= maxX + 30 && cY >= minY - 30 && cY <= maxY + 30);
          });

          let pathD = '';
          let labelX = (srcCoords.x + tgtCoords.x) / 2;
          let labelY = (srcCoords.y + tgtCoords.y) / 2;

          const lineType = conn.lineType || (doesIntersectOtherNode ? 'orthogonal' : 'bezier');

          if (lineType === 'straight') {
            [pathD, labelX, labelY] = getStraightPath({
              sourceX: srcCoords.x,
              sourceY: srcCoords.y,
              targetX: tgtCoords.x,
              targetY: tgtCoords.y
            });
          } else if (lineType === 'orthogonal') {
            [pathD, labelX, labelY] = getSmoothStepPath({
              sourceX: srcCoords.x,
              sourceY: srcCoords.y,
              targetX: tgtCoords.x,
              targetY: tgtCoords.y,
              sourcePosition: srcCoords.position,
              targetPosition: tgtCoords.position,
              borderRadius: 14
            });
          } else {
            // Default Smooth Bezier curve
            [pathD, labelX, labelY] = getBezierPath({
              sourceX: srcCoords.x,
              sourceY: srcCoords.y,
              targetX: tgtCoords.x,
              targetY: tgtCoords.y,
              sourcePosition: srcCoords.position,
              targetPosition: tgtCoords.position
            });
          }

          const isSelected = selectedConnectionId === conn.id;
          const connColor = conn.color || '#64748B';
          const strokeWidth = conn.thickness || 2;
          const colorHexClean = connColor.replace('#', '');

          const markerEnd = (conn.arrow === 'end' || conn.arrow === 'both') ? `url(#arrow-end-${colorHexClean})` : undefined;
          const markerStart = (conn.arrow === 'both') ? `url(#arrow-start-${colorHexClean})` : undefined;

          let strokeDasharray = undefined;
          if (conn.lineStyle === 'dashed') strokeDasharray = '6 4';

          return (
            <g key={conn.id} className="connection-path-group">
              <path
                d={pathD}
                fill="none"
                stroke="transparent"
                strokeWidth={Math.max(14, strokeWidth + 8)}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedConnectionId(conn.id);
                  setSelectedId(null);
                  setActiveConnPopover(null);
                }}
              />

              <path
                d={pathD}
                fill="none"
                stroke={connColor}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeLinecap="round"
                markerEnd={markerEnd}
                markerStart={markerStart}
                className={`connection-line-path ${isSelected ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedConnectionId(conn.id);
                  setSelectedId(null);
                  setActiveConnPopover(null);
                }}
              />

              {/* INLINE LABEL EDITOR OR RENDERED LABEL */}
              {editingLabelId === conn.id ? (
                <foreignObject
                  x={labelX - 60}
                  y={labelY - 14}
                  width="120"
                  height="28"
                >
                  <input
                    type="text"
                    autoFocus
                    defaultValue={conn.label || ''}
                    className="connection-inline-label-input"
                    onBlur={(e) => {
                      handleUpdateConnectionProp(conn.id, 'label', e.target.value.trim());
                      setEditingLabelId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateConnectionProp(conn.id, 'label', e.target.value.trim());
                        setEditingLabelId(null);
                      } else if (e.key === 'Escape') {
                        setEditingLabelId(null);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </foreignObject>
              ) : (
                conn.label && (
                  <g 
                    transform={`translate(${labelX}, ${labelY})`}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedConnectionId(conn.id);
                      setSelectedId(null);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingLabelId(conn.id);
                    }}
                  >
                    <rect
                      x={-((conn.label.length * 7 + 16) / 2)}
                      y="-11"
                      width={conn.label.length * 7 + 16}
                      height="22"
                      rx="6"
                      fill="var(--bg-card)"
                      stroke={isSelected ? 'var(--accent)' : 'var(--border-subtle)'}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="3"
                      textAnchor="middle"
                      fill="var(--text-primary)"
                      fontSize="11"
                      fontWeight="600"
                      fontFamily="var(--font-heading)"
                    >
                      {conn.label}
                    </text>
                  </g>
                )
              )}
            </g>
          );
        })}

        {connectingState && (
          <line
            x1={connectingState.startX}
            y1={connectingState.startY}
            x2={connectingState.currentX}
            y2={connectingState.currentY}
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeDasharray="4 3"
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* RENDER CARDS */}
      {cards.map((obj) => {
        const isSelected = selectedId === obj.id;
        const isEditing = editingId === obj.id;
        const isTextBlock = obj.type === 'textBlock';
        const isStickyNote = obj.type === 'text' || obj.type === 'sticky';
        const isImage = obj.type === 'image';
        const isHovered = hoveredObjectId === obj.id;

        const currentBg = isStickyNote 
          ? (isDarkMode ? (obj.bgDarkColor || '#383214') : (obj.bgColor || '#FEF9C3'))
          : 'transparent';
        
        const currentTextColor = isStickyNote 
          ? (isDarkMode ? (obj.textDarkColor || '#FEF08A') : (obj.textColor || '#713F12'))
          : 'var(--text-primary)';

        const baseFontSize = obj.fontSize || 16;

        return (
          <div
            key={obj.id}
            ref={el => textBlockRefs.current[obj.id] = el}
            className={`floating-object-wrapper ${isStickyNote ? 'sticky-note-card' : ''} ${isTextBlock ? 'text-block-card' : ''} ${isSelected ? 'selected' : ''} ${isEditing ? 'editing' : ''}`}
            style={{
              position: 'absolute',
              left: `${obj.x}px`,
              top: `${obj.y}px`,
              width: `${obj.width}px`,
              height: `${obj.height}px`,
              zIndex: obj.zIndex || 10,
              backgroundColor: currentBg,
              border: isSelected 
                ? '1px solid var(--accent)' 
                : (isStickyNote ? '1px solid rgba(0,0,0,0.08)' : '1px solid transparent'),
              boxShadow: isStickyNote 
                ? '0 6px 18px rgba(0,0,0,0.08)' 
                : (isSelected ? '0 0 0 2px var(--accent-light)' : 'none'),
              transform: 'translate3d(0,0,0)',
              cursor: isConnectionModeActive ? 'crosshair' : (isEditing ? 'text' : 'grab'),
              fontSize: `${baseFontSize}px`
            }}
            onMouseEnter={() => setHoveredObjectId(obj.id)}
            onMouseLeave={() => setHoveredObjectId(null)}
            onMouseDown={(e) => {
              if (!isConnectionModeActive) {
                e.stopPropagation();
                setSelectedId(obj.id);
                setSelectedConnectionId(null);
              }
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (!isConnectionModeActive && (isStickyNote || isTextBlock)) {
                setSelectedId(obj.id);
                setEditingId(obj.id);
                setSelectedConnectionId(null);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSelectedId(obj.id);
              setSelectedConnectionId(null);

              const cardEl = e.currentTarget;
              const rect = cardEl.getBoundingClientRect();
              const menuWidth = 190;
              const menuHeight = 220;
              const offset = 12;

              let left = rect.right + offset;
              if (left + menuWidth > window.innerWidth - 12) {
                left = rect.left - menuWidth - offset;
              }
              left = Math.max(12, Math.min(left, window.innerWidth - menuWidth - 12));

              let top = rect.top;
              if (top + menuHeight > window.innerHeight - 12) {
                top = Math.max(12, window.innerHeight - menuHeight - 12);
              }

              setContextMenu({ x: left, y: top, id: obj.id });
            }}
          >
            {/* CONNECTION HANDLES (4 connection dots directly accessible on card hover or selection) */}
            {(isHovered || isSelected || connectingState?.fromId === obj.id) && (
              <>
                {['top', 'bottom', 'left', 'right'].map(hName => (
                  <div
                    key={hName}
                    className={`connection-handle handle-${hName}`}
                    onPointerDown={(e) => handleStartConnectDrag(e, obj.id, hName)}
                    title={`Connect from ${hName}`}
                  />
                ))}
              </>
            )}

            {/* ACTION TOOLBAR ABOVE SELECTED OBJECT */}
            {isSelected && !isConnectionModeActive && (
              <div className="sticky-note-mini-toolbar" onClick={(e) => e.stopPropagation()}>
                {isImage && (
                  <button 
                    className="sticky-toolbar-btn" 
                    onClick={() => handleReplaceImageClick(obj.id)}
                    title="Replace Image"
                  >
                    <ImageIcon size={14} color="#10B981" />
                  </button>
                )}

                {isStickyNote && (
                  <div style={{ position: 'relative' }}>
                    <button 
                      className="sticky-toolbar-btn" 
                      onClick={() => setActiveColorPopoverId(activeColorPopoverId === obj.id ? null : obj.id)}
                      title="Background Color"
                    >
                      <Palette size={14} color={currentTextColor} />
                    </button>

                    {activeColorPopoverId === obj.id && (
                      <div className="sticky-color-popover">
                        {STICKY_COLORS.map(c => (
                          <button
                            key={c.name}
                            className="sticky-swatch-btn"
                            style={{ background: c.value, border: '1px solid rgba(0,0,0,0.2)' }}
                            title={c.name}
                            onClick={() => handleChangeStickyColor(obj.id, c)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(isStickyNote || isTextBlock) && (
                  <button 
                    className={`sticky-toolbar-btn ${isEditing ? 'active' : ''}`}
                    onClick={() => setEditingId(isEditing ? null : obj.id)}
                    title={isEditing ? "Exit Edit Mode (Esc)" : "Edit Text (Double Click)"}
                  >
                    <Edit3 size={14} color="var(--accent)" />
                  </button>
                )}

                <button 
                  className="sticky-toolbar-btn" 
                  onClick={() => handleDuplicateObject(obj.id)}
                  title="Duplicate (Ctrl+D)"
                >
                  <Copy size={14} color="#0078D4" />
                </button>

                <button 
                  className="sticky-toolbar-btn" 
                  onClick={() => handleBringForward(obj.id)}
                  title="Bring Forward (Ctrl+Shift+])"
                >
                  <ArrowUp size={14} />
                </button>

                <button 
                  className="sticky-toolbar-btn" 
                  onClick={() => handleSendBackward(obj.id)}
                  title="Send Backward (Ctrl+Shift+[)"
                >
                  <ArrowDown size={14} />
                </button>

                <button 
                  className="sticky-toolbar-btn danger" 
                  onClick={() => handleDeleteObject(obj.id)}
                  title="Delete (Del)"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            {/* DRAG HEADER BAR WHEN NOT EDITING */}
            {!isEditing && !isConnectionModeActive && (
              <div
                className="drag-header-bar"
                title="Drag to move"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setSelectedId(obj.id);
                  setSelectedConnectionId(null);
                  setDragState({
                    id: obj.id,
                    startX: e.clientX,
                    startY: e.clientY,
                    origX: obj.x,
                    origY: obj.y
                  });
                }}
              />
            )}

            {/* CARD CONTENT */}
            {isImage ? (
              <img 
                src={obj.src} 
                alt="Floating Asset" 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 6,
                  pointerEvents: 'none',
                  userSelect: 'none',
                  WebkitUserDrag: 'none'
                }} 
              />
            ) : isTextBlock ? (
              <TextBlockEditorContent
                content={obj.content || '<p>Floating Text Block</p>'}
                isEditing={isEditing}
                containerRef={el => textBlockRefs.current[obj.id] = el}
                onContentChange={(newHtml) => {
                  onUpdateObjects(
                    objects.map(o => o.id === obj.id ? { ...o, content: newHtml } : o)
                  );
                }}
              />
            ) : (
              <textarea
                readOnly={!isEditing}
                value={obj.content || ''}
                placeholder="Type your study note here..."
                className={`sticky-note-text-area ${isEditing ? 'editing' : ''}`}
                style={{
                  width: '100%',
                  height: '100%',
                  padding: '12px 14px',
                  outline: 'none',
                  border: 'none',
                  background: 'transparent',
                  resize: 'none',
                  fontFamily: 'var(--font-body)',
                  fontSize: `${baseFontSize}px`,
                  lineHeight: 1.4,
                  color: currentTextColor,
                  overflowY: 'auto',
                  direction: 'ltr',
                  textAlign: 'left',
                  userSelect: isEditing ? 'text' : 'none',
                  cursor: isEditing ? 'text' : 'grab'
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateObjects(
                    objects.map(o => o.id === obj.id ? { ...o, content: val } : o)
                  );
                }}
                onMouseDown={(e) => {
                  if (isEditing) e.stopPropagation();
                }}
                onKeyDown={(e) => {
                  if (isEditing) {
                    e.stopPropagation();
                    if (e.key === 'Escape') setEditingId(null);
                  }
                }}
              />
            )}

            {/* RESIZE HANDLES */}
            {isSelected && !isConnectionModeActive && (
              <>
                {['tl', 'tc', 'tr', 'cl', 'cr', 'bl', 'bc', 'br'].map(handle => (
                  <div
                    key={handle}
                    className={`resize-handle handle-${handle}`}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setResizeState({
                        id: obj.id,
                        type: obj.type,
                        handle,
                        startX: e.clientX,
                        startY: e.clientY,
                        origW: obj.width,
                        origH: obj.height,
                        origX: obj.x,
                        origY: obj.y,
                        origFontSize: baseFontSize
                      });
                    }}
                  />
                ))}
              </>
            )}
          </div>
        );
      })}

      {/* ICON-DRIVEN COMPACT CONNECTION TOOLBAR (38px height) */}
      {selectedConnectionObj && (
        <div
          className="connection-property-toolbar compact-bar"
          style={{
            position: 'fixed',
            left: Math.min(window.innerWidth - 180, Math.max(20, (layerRef.current?.getBoundingClientRect().left || 0) + toolbarLeft - 60)),
            top: Math.min(window.innerHeight - 60, Math.max(50, (layerRef.current?.getBoundingClientRect().top || 0) + toolbarTop - 48)),
            zIndex: 9999
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {/* Pointer / Line Color Popover (Palette) */}
          <div style={{ position: 'relative' }}>
            <button 
              className={`conn-btn icon-only ${activeConnPopover === 'style' ? 'active' : ''}`}
              onClick={() => setActiveConnPopover(activeConnPopover === 'style' ? null : 'style')}
              data-tooltip="Pointer Color"
            >
              <Palette size={15} color={selectedConnectionObj.color || 'var(--accent)'} />
            </button>

            {activeConnPopover === 'style' && (
              <div className="conn-popover-menu" style={{ padding: '8px 10px' }}>
                <span className="conn-popover-label" style={{ marginBottom: 6, display: 'block', fontSize: 11 }}>Pointer Color</span>
                <div className="conn-swatch-grid">
                  {CONNECTION_COLORS.map(c => (
                    <button
                      key={c.value}
                      className={`conn-swatch ${selectedConnectionObj.color === c.value ? 'active' : ''}`}
                      style={{ background: c.value }}
                      data-tooltip={c.name}
                      onClick={() => {
                        handleUpdateConnectionProp(selectedConnectionObj.id, 'color', c.value);
                        setActiveConnPopover(null);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="conn-divider" />

          {/* Arrow Popover (ArrowRight) */}
          <div style={{ position: 'relative' }}>
            <button 
              className={`conn-btn icon-only ${activeConnPopover === 'arrow' ? 'active' : ''}`}
              onClick={() => setActiveConnPopover(activeConnPopover === 'arrow' ? null : 'arrow')}
              data-tooltip="Arrowhead Style"
            >
              <ArrowRight size={15} />
            </button>

            {activeConnPopover === 'arrow' && (
              <div className="conn-popover-menu" style={{ width: '120px' }}>
                <div className="conn-btn-group vertical">
                  <button
                    className={`conn-sub-btn ${selectedConnectionObj.arrow === 'none' || !selectedConnectionObj.arrow ? 'active' : ''}`}
                    onClick={() => handleUpdateConnectionProp(selectedConnectionObj.id, 'arrow', 'none')}
                    data-tooltip="No Arrow"
                  >
                    — None
                  </button>
                  <button
                    className={`conn-sub-btn ${selectedConnectionObj.arrow === 'end' ? 'active' : ''}`}
                    onClick={() => handleUpdateConnectionProp(selectedConnectionObj.id, 'arrow', 'end')}
                    data-tooltip="Single Arrow"
                  >
                    → Single
                  </button>
                  <button
                    className={`conn-sub-btn ${selectedConnectionObj.arrow === 'both' ? 'active' : ''}`}
                    onClick={() => handleUpdateConnectionProp(selectedConnectionObj.id, 'arrow', 'both')}
                    data-tooltip="Double Arrow"
                  >
                    ⇄ Double
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="conn-divider" />

          {/* Inline Label Tool (Tag) */}
          <button
            className="conn-btn icon-only"
            onClick={() => setEditingLabelId(selectedConnectionObj.id)}
            data-tooltip={selectedConnectionObj.label ? `Label: "${selectedConnectionObj.label}"` : 'Edit Label'}
          >
            <Tag size={15} />
          </button>

          <div className="conn-divider" />

          {/* Delete Connection (Trash2) */}
          <button
            className="conn-btn icon-only danger"
            onClick={() => {
              onUpdateObjects(objects.filter(o => o.id !== selectedConnectionObj.id));
              setSelectedConnectionId(null);
            }}
            data-tooltip="Delete Connection (Del)"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}

      {/* CONTEXT MENU ATTACHED TO OBJECT */}
      {contextMenu && (
        <div 
          className="floating-context-menu"
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            zIndex: 9999
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {(() => {
            const targetObj = cards.find(o => o.id === contextMenu.id);
            if (!targetObj) return null;

            const logAction = (action) => {
              console.log('[ContextMenu Execution]', {
                objectId: targetObj.id,
                objectType: targetObj.type,
                action
              });
            };

            if (targetObj.type === 'textBlock') {
              return (
                <>
                  <button 
                    className="context-menu-item" 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      logAction('Edit Text');
                      setSelectedId(targetObj.id);
                      setEditingId(targetObj.id);
                      setContextMenu(null);
                    }}
                  >
                    <Edit3 size={14} />
                    <span>Edit Text</span>
                  </button>

                  <button 
                    className="context-menu-item" 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      logAction('Auto Size');
                      handleAutoSize(targetObj.id);
                    }}
                  >
                    <Maximize2 size={14} />
                    <span>Auto Size / Fit Text</span>
                  </button>

                  <div className="context-menu-divider" />

                  <button 
                    className="context-menu-item" 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      logAction('Duplicate');
                      handleDuplicateObject(targetObj.id);
                    }}
                  >
                    <Copy size={14} />
                    <span>Duplicate</span>
                    <span className="context-shortcut">Ctrl+D</span>
                  </button>

                  <button 
                    className="context-menu-item" 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      logAction('Bring Forward');
                      handleBringForward(targetObj.id);
                    }}
                  >
                    <ArrowUp size={14} />
                    <span>Bring Forward</span>
                  </button>

                  <button 
                    className="context-menu-item" 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      logAction('Send Backward');
                      handleSendBackward(targetObj.id);
                    }}
                  >
                    <ArrowDown size={14} />
                    <span>Send Backward</span>
                  </button>

                  <div className="context-menu-divider" />

                  <button 
                    className="context-menu-item danger" 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      logAction('Delete');
                      handleDeleteObject(targetObj.id);
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                    <span className="context-shortcut">Del</span>
                  </button>
                </>
              );
            } else if (targetObj.type === 'image') {
              return (
                <>
                  <button 
                    className="context-menu-item" 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      logAction('Replace Image');
                      handleReplaceImageClick(targetObj.id);
                      setContextMenu(null);
                    }}
                  >
                    <ImageIcon size={14} />
                    <span>Replace Image</span>
                  </button>

                  <button 
                    className="context-menu-item" 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      logAction('Reset Size');
                      handleResetImageSize(targetObj.id);
                    }}
                  >
                    <Minimize2 size={14} />
                    <span>Reset Size</span>
                  </button>

                  <div className="context-menu-divider" />

                  <button 
                    className="context-menu-item" 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      logAction('Duplicate');
                      handleDuplicateObject(targetObj.id);
                    }}
                  >
                    <Copy size={14} />
                    <span>Duplicate</span>
                    <span className="context-shortcut">Ctrl+D</span>
                  </button>

                  <button 
                    className="context-menu-item" 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      logAction('Bring Forward');
                      handleBringForward(targetObj.id);
                    }}
                  >
                    <ArrowUp size={14} />
                    <span>Bring Forward</span>
                  </button>

                  <button 
                    className="context-menu-item" 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      logAction('Send Backward');
                      handleSendBackward(targetObj.id);
                    }}
                  >
                    <ArrowDown size={14} />
                    <span>Send Backward</span>
                  </button>

                  <div className="context-menu-divider" />

                  <button 
                    className="context-menu-item danger" 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      logAction('Delete');
                      handleDeleteObject(targetObj.id);
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                    <span className="context-shortcut">Del</span>
                  </button>
                </>
              );
            } else {
              // Sticky Note
              return (
                <>
                  <button 
                    className="context-menu-item" 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      logAction('Edit Note');
                      setSelectedId(targetObj.id);
                      setEditingId(targetObj.id);
                      setContextMenu(null);
                    }}
                  >
                    <Edit3 size={14} />
                    <span>Edit Note</span>
                  </button>

                  <button 
                    className="context-menu-item" 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      logAction('Change Color');
                      setSelectedId(targetObj.id);
                      setActiveColorPopoverId(targetObj.id);
                      setContextMenu(null);
                    }}
                  >
                    <Palette size={14} />
                    <span>Change Color</span>
                  </button>

                  <div className="context-menu-divider" />

                  <button 
                    className="context-menu-item" 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      logAction('Duplicate');
                      handleDuplicateObject(targetObj.id);
                    }}
                  >
                    <Copy size={14} />
                    <span>Duplicate</span>
                    <span className="context-shortcut">Ctrl+D</span>
                  </button>

                  <button 
                    className="context-menu-item" 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      logAction('Bring Forward');
                      handleBringForward(targetObj.id);
                    }}
                  >
                    <ArrowUp size={14} />
                    <span>Bring Forward</span>
                  </button>

                  <button 
                    className="context-menu-item" 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      logAction('Send Backward');
                      handleSendBackward(targetObj.id);
                    }}
                  >
                    <ArrowDown size={14} />
                    <span>Send Backward</span>
                  </button>

                  <div className="context-menu-divider" />

                  <button 
                    className="context-menu-item danger" 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      logAction('Delete');
                      handleDeleteObject(targetObj.id);
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                    <span className="context-shortcut">Del</span>
                  </button>
                </>
              );
            }
          })()}
        </div>
      )}
    </div>
  );
}
