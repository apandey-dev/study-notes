# Feature Inventory

This document details every feature currently built into the **Study Notes** desktop application.

---

## 1. Home Screen
- **Status**: Working
- **Description**: The default landing page displaying recent notes, search bars, file import zone, and theme toggle controls.
- **Files**: 
  - [`HomeScreen.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/HomeScreen.jsx) (UI component)
  - [`App.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/App.jsx) (App routing & notes state)
- **Dependencies**: `lucide-react`
- **Known Issues**: None.

## 2. Recent Notes (CRUD)
- **Status**: Working
- **Description**: Displays recent notes history read from the default directory (`Documents`). Provides inline options to Rename, Duplicate, Delete, or Remove notes from history.
- **Files**:
  - [`HomeScreen.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/HomeScreen.jsx) (Actions UI)
  - [`recentNotes.js`](file:///C:/Users/arpit/Desktop/study-notes/src/utils/recentNotes.js) (Recent notes manager)
  - [`main.js`](file:///C:/Users/arpit/Desktop/study-notes/electron/main.js) (FS operations)
- **Dependencies**: `electron`, `fs`
- **Known Issues**: None.

## 3. Note Creation Flow
- **Status**: Working
- **Description**: Triggers a native system Save File dialog asking for a location and name. Re-verifies file existence before instantiating the Editor canvas.
- **Files**:
  - [`App.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/App.jsx) (Creation orchestration)
  - [`main.js`](file:///C:/Users/arpit/Desktop/study-notes/electron/main.js) (IPC showSaveDialog handler)
- **Dependencies**: `electron` (dialog API)
- **Known Issues**: None.

## 4. Autosave Engine
- **Status**: Working
- **Description**: High-performance, debounced (100ms) background saver that converts active editor HTML + floating overlay metadata into a unified Markdown/Text format and saves directly to disk. Includes synchronous flush on window beforeunload.
- **Files**:
  - [`App.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/App.jsx) (Auto-save trigger hooks)
  - [`markdownConverter.js`](file:///C:/Users/arpit/Desktop/study-notes/src/utils/markdownConverter.js) (Serialization helpers)
- **Dependencies**: `turndown`
- **Known Issues**: Rapid typing followed by immediately closing the window might occasionally lose the last keystroke if the beforeunload listener fails to execute in time, though this is heavily mitigated by local session restore cache.

## 5. Session Restore
- **Status**: Working
- **Description**: Persists active note screen state, scroll position, note type, activeFile properties, zoom level, and floating objects list to localStorage, allowing automatic restore on hot reload or restart.
- **Files**:
  - [`App.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/App.jsx) (Mount restore hook)
- **Dependencies**: None
- **Known Issues**: None.

## 6. Theme Engine
- **Status**: Working
- **Description**: Supports highly-polished Fluent Dark and Light themes. The selected theme toggles custom CSS variables on `document.documentElement` and is saved to the AppData `config.json` configuration file.
- **Files**:
  - [`App.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/App.jsx)
  - [`index.css`](file:///C:/Users/arpit/Desktop/study-notes/src/index.css) (CSS tokens)
  - [`main.js`](file:///C:/Users/arpit/Desktop/study-notes/electron/main.js) (config file storage)
- **Dependencies**: `electron`
- **Known Issues**: None.

## 7. Ruled & Plain Page Layouts
- **Status**: Working
- **Description**: Ruled layout places a background image gradient representing a writing line height of exactly `36px`. Plain page clears the background grid for visual sketching.
- **Files**:
  - [`EditorCanvas.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/EditorCanvas.jsx)
  - [`index.css`](file:///C:/Users/arpit/Desktop/study-notes/src/index.css)
- **Dependencies**: None
- **Known Issues**: None.

## 8. Floating Visual Overlay (Sticky Notes, Images, Text Blocks)
- **Status**: Working
- **Description**: Supports overlaying non-linear assets on top of text. Draggable and resizable containers with custom color palettes and text/image content wrappers.
- **Files**:
  - [`FloatingObjectLayer.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/FloatingObjectLayer.jsx) (Main engine)
- **Dependencies**: `lucide-react`, Tiptap (nested inline editors for text blocks)
- **Known Issues**: Images with very large resolutions may cause slight rendering lag during active resizing.

## 9. Interactive Connections Engine
- **Status**: Working
- **Description**: Visual connections between floating objects. Provides auto-anchoring (computes shortest distance between Top, Bottom, Left, and Right faces), customized line stroke, colors, straight/bezier paths, and mouse hover context settings.
- **Files**:
  - [`FloatingObjectLayer.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/FloatingObjectLayer.jsx)
- **Dependencies**: `@xyflow/react` (for path geometry calculation)
- **Known Issues**: None.

## 10. Related Branches Hierarchy
- **Status**: Working
- **Description**: Implements inline related lines using `Shift + Enter` to visually hook lines of text together. Connectors are rendered inside a dedicated SVG Layer 1 (`z-index: 10`), leaving Layer 2 (`z-index: 20`) clean for Text edits. Parent headers can collapse/expand child nodes.
- **Files**:
  - [`EditorCanvas.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/EditorCanvas.jsx) (layout measurement & event handlers)
  - [`customRelatedBranchesExtension.js`](file:///C:/Users/arpit/Desktop/study-notes/src/utils/customRelatedBranchesExtension.js) (Tiptap keyboard/commands hook)
- **Dependencies**: Tiptap core, `@tiptap/pm`
- **Known Issues**: None.

## 11. Search and Replace
- **Status**: Working
- **Description**: Full-document search dialog that highlights text matches inside TipTap, supporting Match Case, Whole Word, and Wrap Around parameters. Supports replacing single occurrences or all occurrences instantly.
- **Files**:
  - [`SearchOverlay.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/SearchOverlay.jsx)
- **Dependencies**: None
- **Known Issues**: Highlight indicators sometimes take a fraction of a second to sync during rapid typing.

## 12. PNG/PDF Document Exporter
- **Status**: Working
- **Description**: High-fidelity exporter that clones the document DOM, cleans UI overlays (toolbar, context buttons, resizers), applies selected document themes (Ruled, Plain, Charcoal Dark, Sepia, Blueprint, Grid), and creates highly-polished PDF/PNG documents.
- **Files**:
  - [`ExportModal.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/ExportModal.jsx)
- **Dependencies**: `html2canvas`, `jspdf`
- **Known Issues**: None.

## 13. Text Formatting Toolbar & Slash Commands
- **Status**: Working
- **Description**: Extensible editing toolbar for standard styling (Bold, Italic, Underline, Font Face, Text Color, Headers H1-H4, Bullet/Numbered/Check lists, Table Inserter). Slash commands `/h1`, `/bullet`, `/table` act as keyboard accelerators.
- **Files**:
  - [`Toolbar.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/Toolbar.jsx)
  - [`customSlashCommandsExtension.js`](file:///C:/Users/arpit/Desktop/study-notes/src/utils/customSlashCommandsExtension.js)
- **Dependencies**: `lucide-react`, `@tiptap/extension-table`
- **Known Issues**: None.
