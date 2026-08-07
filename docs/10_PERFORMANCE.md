# Performance Analysis

This document reviews rendering speeds, memory constraints, and export bottlenecks.

---

## 1. Key Performance Bottlenecks

### 1. Multi-Editor Memory Spikes
- **Description**: Each floating Text Block card created in `FloatingObjectLayer` instantiates a dedicated Tiptap rich-text editor instance using `useEditor`.
- **Performance Impact**: If a user creates 15-20 floating text cards on a page, they will have 20 separate ProseMirror and Tiptap instances running concurrently. This will cause substantial heap memory allocation and CPU cycles during keystroke broadcasts.
- **Optimization**: Implement a **Lazy Editing** model: render text blocks as clean HTML static blocks when idle, and instantiate a single shared editing window or load the editor only when the card is double-clicked.

### 2. High-Frequency SVG Connector Re-draws
- **Description**: The outline connector generator (`updateConnectorPaths` inside `EditorCanvas.jsx`) runs bounds checks and updates the SVG path nodes in Layer 1.
- **Performance Impact**: It runs inside a `requestAnimationFrame` loop triggered by the `content` dependency (on every keypress). In documents with 100+ nested lines, searching the DOM and measuring offsets on every character stroke results in noticeable CPU lag.
- **Optimization**: Throttle the redraw handler (e.g. limit to 30fps / every 33ms) or trigger calculations only when line heights shift, rather than on every keystroke.

### 3. Turndown DOM Traversal Overhead
- **Description**: The autosave system converts the entire document from HTML to Markdown via the Turndown parser every 100ms.
- **Performance Impact**: In large documents (5,000+ words), traversing the DOM tree and string parsing every 100ms leads to layout thrashing and UI freezes during typing.
- **Optimization**: Throttle the autosave timer to 3-5 seconds of idle keyboard time, or trigger on blur and key combos (`Ctrl + S`).

---

## 2. Export Rendering Overhead
- **Description**: PDF and PNG exports use `html2canvas` to clone the DOM, render it to a Canvas, and convert it to a image bitmap.
- **Performance Impact**: This process is CPU-intensive. Exporting a large multi-page document can block the main JavaScript thread for 2-3 seconds, showing a loading spinner.
- **Optimization**: Migrate to Electron's native print-to-PDF APIs, which generate PDF files instantly in a background thread.
