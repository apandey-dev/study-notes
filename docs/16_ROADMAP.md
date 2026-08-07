# Engineering Roadmap

This document outlines immediate, medium-term, and long-term development plans to improve stability, performance, and structure.

---

## 1. Short-Term Objectives (Immediate)

### A. Remove Orphaned Files & Clean Dependencies
- **Task**: Safely delete the 7 legacy components (`PageCanvas.jsx`, `EditorToolbar.jsx`, `EmptyState.jsx`, `NewPageModal.jsx`, `ChoosePageTypeModal.jsx`, `PageManagementModal.jsx`, `StickyNoteComponent.jsx`) and `notebookStorage.js`. Remove `canvas-confetti` from `package.json`.
- **Impact**: Decreases bundle sizing and clutter.

### B. Complete the Freehand Ink Drawing Canvas
- **Task**: Implement a transparent canvas drawing container overlaying the editor inside `FloatingObjectLayer.jsx` to capture brush strokes, serializing pen lines as SVG path nodes so drawing functions work.
- **Impact**: Fully implements the incomplete drawing tool feature.

### C. Throttle Autosave Parser
- **Task**: Adjust the autosave debounce timer from `100ms` to `3000ms` (3 seconds) or trigger writes on editor blur events and key bindings (`Ctrl + S`).
- **Impact**: Prevents lag and freezes when editing large document files.

---

## 2. Medium-Term Objectives (3 to 6 Months)

### A. Component Refactoring & Modularity
- **Task**: Extract elements from the monolithic `FloatingObjectLayer.jsx` into smaller modules:
  - `StickyCard.jsx`
  - `ImageCard.jsx`
  - `TextBlockCard.jsx`
  - `autoArrangeSolver.js`
- **Impact**: Simplifies maintainability, testing, and additions.

### B. Local Assets Cache for Images
- **Task**: Instead of encoding image attachments as massive base64 strings embedded directly inside the document, copy the files into a local folder (`%APPDATA%/Study Notes/assets/`) and reference the local file path.
- **Impact**: Prevents document file bloat and saves memory/CPU during typing autosaves.

### C. Close Blocker for Autosave
- **Task**: Implement a main process window close blocker that intercepts close commands and waits for a "File Write Complete" confirmation before shutting down.
- **Impact**: Eliminates document corruption or truncation risks during rapid exit commands.

---

## 3. Long-Term Objectives (6+ Months)

### A. Package-Based Storage Format (`.study`)
- **Task**: Transition the storage model to a package format (a ZIP archive renamed to `.study` containing the standard Markdown `document.md` and metadata layout `canvas.json`).
- **Impact**: Standardizes note files and protects metadata from being corrupted by external text editors.

### B. Vector PDF Prints via Chromium
- **Task**: Replace `html2canvas` and `jsPDF` slicing setups with Chromium's native `webContents.printToPDF` API.
- **Impact**: Generates crisp, searchable vector PDF files, eliminates page layout math, and accelerates export speeds.
