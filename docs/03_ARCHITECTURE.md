# Application Architecture

This document details the multi-layer stack, data flow, process boundary IPCs, and processing engines.

---

## 1. Multi-Layer Stacking Architecture
To prevent graphical decorations (connector lines, collapse buttons, visual outlines) from interfering with core rich text editing (selection, text flow, cursor positioning, and typing performance), rendering is split into three independent layout layers stacked along the Z-axis:

```
┌────────────────────────────────────────────────────────┐
│  Layer 3: Visual Overlays (z-index: 30)                │
│  - Draggable & Resizable Sticky Notes & Text Blocks    │
│  - Resizing controls, drag handles, context menus      │
└──────────────────────────┬─────────────────────────────┘
                           │ (Overlaid on top)
┌──────────────────────────▼─────────────────────────────┐
│  Layer 2: Rich Text Editor Canvas (z-index: 20)        │
│  - ProseMirror/TipTap editor container                 │
│  - Pure typography & layout elements (P, H1-H4, List) │
│  - Strict 36px ruled line grid alignment               │
└──────────────────────────┬─────────────────────────────┘
                           │ (Draws behind text)
┌──────────────────────────▼─────────────────────────────┐
│  Layer 1: SVG Layout & Connector Canvas (z-index: 10)  │
│  - Related branches connector curves & chevrons       │
│  - Knowledge graph connector arrows                   │
│  - Debug mode alignments and coordinates              │
└────────────────────────────────────────────────────────┘
```

- **Layer 1 (Bottom, `z-index: 10`)**: An absolute SVG overlay (`.branch-connectors-svg`) positioned exactly behind the editor. It reads layout bounding rectangles from the DOM elements in Layer 2 and draws curved connectors, expand/collapse chevrons, and debug bounding boxes. It uses `pointer-events: none` globally, except for the chevrons which delegate click triggers via event coordinates.
- **Layer 2 (Middle, `z-index: 20`)**: The ProseMirror editing surface. It has no pseudo-elements (`::before`, `::after`), absolute overlays, or custom borders. Paragraphs and headers align exactly to the background ruled lines by maintaining a 0px vertical margin/padding and strict `36px` line-height blocks.
- **Layer 3 (Top, `z-index: 30`)**: Floating objects. It contains draggable notes, image attachment nodes, resize frames, and node connecting paths.

---

## 2. Process Boundary IPC Map
Electron acts as a secure shell enclosing our React bundle. System operations bypass React web sandboxing by passing messages through the context bridge preload layer:

```
[React Renderer Process]
         │ (calls window.electronAPI.readFileContent)
         ▼
  [preload.js Bridge]
         │ (ipcRenderer.invoke('read-file-content', data))
   IPC Boundary (Context Isolation Enabled)
         ▼
[Electron Main Process (node.js)]
         │ (checks app paths, calls fs.readFileSync)
         ▼
     [Hard Disk]
```

### Registered IPC Channels:
- **`window-minimize` / `window-maximize` / `window-close`**: Window state modifiers.
- **`create-file-dialog` / `open-file-dialog`**: Invokes native OS file dialogs and retrieves absolute paths.
- **`save-file-content` / `read-file-content`**: Direct local disk operations.
- **`check-file-exists` / `rename-file` / `delete-file` / `duplicate-file`**: Disk CRUD operations.
- **`get-workspace-files`**: Automatically scans the Windows `Documents` folder for associated notes.
- **`get-app-config` / `save-app-config`**: Manages global persistent settings in AppData (%APPDATA%/Study Notes/config.json).

---

## 3. Data Sync & Autosave Flow
Autosave is structured around React state updates flowing into a debounced disk-saving hook:

1. **State Update**: Any keystroke in TipTap triggers `onUpdate()`, writing HTML to the `editorContent` state. Adding or moving sticky notes updates the `floatingObjects` state.
2. **Debounce (100ms)**: A `useEffect` hook monitors changes to `editorContent` and `floatingObjects`, resetting a 100ms timer on every keypress.
3. **Serialization**: When the timer fires, `serializeFileContent` converts the HTML to clean Markdown and packages the `floatingObjects` list into a JSON block appended as an HTML comment (`<!-- FLOATING_OBJECTS_DATA: [...] -->`) at the end of the file.
4. **Flush Save**: Preload calls `window.electronAPI.saveFileContent`, writing the file directly to disk asynchronously.
5. **Immediate Sync Flush**: A `beforeunload` event handler intercepts reloads, page transitions, or window close commands, executing a synchronous write to prevent any data loss.

---

## 4. Key Engines

### Outline Related Branches Engine
- **Command Rule**: When `Shift + Enter` is pressed, the custom TipTap extension creates a new block node with a unique `branchId` (UUID) and assigns its `branchParent` to the ID of the line the cursor was on.
- **Indentation**: The level depth is calculated incrementally. Each level translates into a horizontal indentation of exactly `N * 24px` (`margin-left: N * 24px !important`).
- **SVG Connector Drawing**: The callback `updateConnectorPaths` queries DOM nodes matching `[data-branch-id]`. It extracts their vertical bounding boxes (`top`, `bottom`) and horizontal coordinates (`left`). It maps curved connection paths (`M x y L ... Q ...`) inside Layer 1 from the bottom of the parent line to the visual vertical center of the child line.
- **Event Delegation**: Mouse hover highlights and click events (for folding/collapsing nodes) are captured at the editor canvas element. High-performance event delegation detects mouse coordinates relative to the 24px gutter columns, avoiding active listeners on individual lines.

### Floating Canvas Engine
- **Coordinates**: Stores floating objects as absolute coordinates `{ x, y, width, height, content }` in a state array.
- **Rendering**: Absolutely positions widgets inside Layer 3. Resizers modify width/height parameters. Drag-and-drop actions update `x` and `y` positions.
- **Connection Graph**: A database of links `{ id, fromId, toId, label, color, type }`. The connecting engine queries the coordinates of `fromId` and `toId`, finds their closest boundaries (Smart Auto-Anchoring), and generates SVG paths using `@xyflow/react` path solvers.
