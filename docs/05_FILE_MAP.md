# File Map

This document catalogs every source file in the repository, explaining its purpose, dependencies, and technical risk factor.

---

## 1. Electron Process Files

| File Path | Purpose | Key Responsibilities | Risks if Modified |
|---|---|---|---|
| [`electron/main.js`](file:///C:/Users/arpit/Desktop/study-notes/electron/main.js) | Electron Entry Point | App initialization, browser window creation, window bounds persistence, and registering filesystem IPC channels. | **High**: Incorrect path parsing or security API flags will break startup or crash the app. |
| [`electron/preload.js`](file:///C:/Users/arpit/Desktop/study-notes/electron/preload.js) | IPC Bridge | Securely exposes native IPC methods to the React renderer thread via `contextBridge`. | **High**: Modifying exposed API schemas will break React file CRUD operations. |

---

## 2. Core React UI Components (Active)

| File Path | Purpose | Key Responsibilities | Risks if Modified |
|---|---|---|---|
| [`src/App.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/App.jsx) | Application Core State | Tracks notes, folder structures, active workspace tabs, theme states, and runs debounced autosave hooks. | **Critical**: Controls the primary state machine. Code breaks here break the entire app. |
| [`src/components/EditorCanvas.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/EditorCanvas.jsx) | Primary Editor Canvas | Wraps Tiptap editor in Layer 2, draws outline connectors in Layer 1, and manages scroll updates. | **High**: Coordinates rendering layers; positioning errors will break notebook grid alignment. |
| [`src/components/FloatingObjectLayer.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/FloatingObjectLayer.jsx) | Layer 3 Overlay | Manages dragging, resizing, editing, and node connections for sticky notes and images. | **Medium**: Logic changes can break object bounds, connection lines, or cause resize jumps. |
| [`src/components/Toolbar.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/Toolbar.jsx) | Styling Toolbar | UI buttons for bold, italics, lists, color pickers, table inserter, and connection tool toggles. | **Medium**: Broken states here will disable editing features in the canvas. |
| [`src/components/Header.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/Header.jsx) | Compact Window Header | Toggles file search overlays, export triggers, and contains note view size settings. | **Low**: Purely cosmetic layout wrapper. |
| [`src/components/TabBar.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/TabBar.jsx) | Tab Navigation | Allows switching between multiple open notes with a visual tab strip. | **Low**: Modifying can break tab closing or switching. |
| [`src/components/HomeScreen.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/HomeScreen.jsx) | Dashboard Screen | Lists recent files, has a folder search bar, file drop box, and rename/delete buttons. | **Medium**: Affects user data actions (renaming, duplicating, deleting notes). |
| [`src/components/SearchOverlay.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/SearchOverlay.jsx) | Find & Replace Panel | Runs find and replace queries using GFM highlights in Tiptap. | **Low**: Modifying can cause highlighting lag. |
| [`src/components/ExportModal.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/ExportModal.jsx) | PNG/PDF Exporter | Clones editor container, applies print themes, scales dimensions, and builds PDF/PNG files. | **Medium**: Broken styles can yield clipped exports or white pages. |
| [`src/components/WindowsTitleBar.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/WindowsTitleBar.jsx) | Frameless Window Frame | Emulates Windows OS title bar controls (Minimize, Maximize, Close) with drag regions. | **Low**: Window control anomalies. |
| [`src/components/CreateNoteModal.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/CreateNoteModal.jsx) | Format Select Modal | Asks user to select note format (Markdown vs Plain Text) before spawning dialog. | **Low**: Creation flow wrapper. |
| [`src/components/InsertTableModal.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/InsertTableModal.jsx)| Table Setup Modal | Selects table dimensions before inserting grid nodes into Tiptap. | **Low**: Table size selector. |
| [`src/components/SettingsModal.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/SettingsModal.jsx) | Config Modal | Displays global configurations like default workspace path. | **Low**: Settings configuration. |
| [`src/components/ErrorBoundary.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/ErrorBoundary.jsx) | Safe Fallback Screen | Captures React render crashes and shows error diagnostic logs. | **Low**: Visual error catcher. |
| [`src/components/LoadingScreen.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/LoadingScreen.jsx) | Splash Loader | Visual startup screen. | **Low**: Visual loader. |
| [`src/components/StickyNoteComponent.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/StickyNoteComponent.jsx)| Sticky Note Widget | Standalone sticky note component (used by legacy canvas only). | **None**: Safe to remove. |

---

## 3. Core React Utilities & Extensions

| File Path | Purpose | Key Responsibilities | Risks if Modified |
|---|---|---|---|
| [`src/utils/markdownConverter.js`](file:///C:/Users/arpit/Desktop/study-notes/src/utils/markdownConverter.js) | Note Serializer | Serializes and parses note text and floating layer state to/from Markdown/Text. | **High**: Errors here will cause note serialization failures or document corruption. |
| [`src/utils/customRelatedBranchesExtension.js`](file:///C:/Users/arpit/Desktop/study-notes/src/utils/customRelatedBranchesExtension.js)| Tiptap Branch Logic | Assigns parent branch attributes on `Shift + Enter` block splits. | **Medium**: Can break outline navigation. |
| [`src/utils/customSlashCommandsExtension.js`](file:///C:/Users/arpit/Desktop/study-notes/src/utils/customSlashCommandsExtension.js) | Tiptap Commands | Input shortcut triggers (`/h1` -> heading, `/bullet` -> list). | **Low**: Keyboard commands shortcuts. |
| [`src/utils/customFontFamilyExtension.js`](file:///C:/Users/arpit/Desktop/study-notes/src/utils/customFontFamilyExtension.js)| Tiptap Fonts | Applies custom typography overrides to text styles. | **Low**: Formatting overrides. |
| [`src/utils/customHeadingExtension.js`](file:///C:/Users/arpit/Desktop/study-notes/src/utils/customHeadingExtension.js) | Tiptap Headings | Adds custom attributes (like branch IDs) on headings. | **Low**: Outline heading nodes. |
| [`src/utils/recentNotes.js`](file:///C:/Users/arpit/Desktop/study-notes/src/utils/recentNotes.js) | Notes History Helper | Slices, sorts, and persists note paths in history list. | **Low**: Dashboard notes sorting. |
| [`src/utils/notebookStorage.js`](file:///C:/Users/arpit/Desktop/study-notes/src/utils/notebookStorage.js) | Legacy Store | Mock schemas for multi-page notebooks (used by legacy components only). | **None**: Safe to remove. |
