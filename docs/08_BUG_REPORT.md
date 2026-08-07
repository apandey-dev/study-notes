# Bug & Edge Cases Report

This document audits potential crashes, logic bugs, visual edge cases, and file corruption risks in the current codebase.

---

## 1. Identified Logic & Functional Bugs

### 1. Incomplete Freehand Ink Drawing
- **Description**: The toolbar exposes Drawing controls (Pen Tool, Highlighter, Eraser, Clear Ink), which set the `drawingTool` state. However, the `FloatingObjectLayer` does not render a canvas or capture mouse drawing coordinates.
- **Severity**: Low (Feature is incomplete/non-functional).
- **Resolution**: Need to implement a transparent `<canvas>` layer inside `FloatingObjectLayer` to capture pointer paths and draw/save them as serialized SVG stroke arrays.

### 2. TabBar activeTabPath Reference Mismatch
- **Description**: In `App.jsx`, when switching active tabs, the application matches tabs using `activeFile.path`. If a file is renamed outside the application, the app-cache path becomes invalid, showing an empty state rather than prompting for reload.
- **Severity**: Low.

---

## 2. Potential Race Conditions & Performance Risks

### 1. Autosave / Window Exit Race Condition
- **Description**: When the application window is closed, a `beforeunload` listener triggers `window.electronAPI.saveFileContent` to flush the final HTML state to disk.
- **Risk**: Because Electron handles IPC handles asynchronously, if the main OS process terminates the renderer thread too quickly after receiving the close event, the write buffer may close before the physical write completes, potentially leading to truncated documents.
- **Mitigation**: Use synchronous IPC (`ipcRenderer.sendSync`) or implement an Electron window close blocker that waits for a file-written acknowledgement before allowing the app process to quit.

### 2. Large Base64 Embedded Images
- **Description**: Floating images are loaded via file dialogs, converted to base64 data URLs, and embedded directly inside the document.
- **Risk**: If the user inserts multiple high-resolution images (e.g. 15MB each), the base64 conversion multiplies the size by ~1.33. This results in a massive Markdown file (40MB+) which is serialized and written to disk every 100ms during typing. This will cause substantial UI freezing and memory exhaustion.
- **Mitigation**: Instruct the main Electron process to copy the source image into a local asset cache directory (e.g. `%APPDATA%/Study Notes/assets/`) and reference the local path (`file:///...`) instead of embedding massive base64 strings.

---

## 3. Export & Rendering Edge Cases

### 1. Cross-Origin Image Taint in Exports
- **Description**: The `ExportModal.jsx` uses `html2canvas` to render the DOM node clone to a bitmap canvas.
- **Risk**: If the user inserts a remote web URL image in their note, the canvas will mark the image as "tainted" due to CORS rules. The image will be missing in the exported PDF or PNG.
- **Mitigation**: Enforce that all images are copied locally first, or proxy remote image fetches through the Electron main thread.

### 2. Table Context Menu Viewport Overflow
- **Description**: The table right-click context menu uses coordinates relative to the click event client position.
- **Risk**: Clicking on cells near the right or bottom edges of the window pushes the menu off-screen, making the formatting buttons unclickable.
- **Mitigation**: Calculate context menu coordinates against viewport width/height bounds, shifting the menu left or up if it exceeds bounds.
