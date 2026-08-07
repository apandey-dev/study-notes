# Feature Status

This document categorizes every feature in the application by its current release status.

---

## 1. Feature Status Matrix

| Feature Group | Specific Feature | Status | User Value | Notes |
|---|---|---|---|---|
| **Core Workspace** | HomeScreen Dashboard | **Working** | High | Shows recent files list, delete, duplicate, rename. |
| | Frameless Titlebar | **Working** | Medium | Drag handle and minimize/maximize/close actions. |
| | Multi-tab Navigation | **Working** | High | Open multiple note tabs simultaneously. |
| | App Settings Modal | **Working** | Low | Toggle default documents workspace path. |
| **Rich Text Editor**| TipTap Core Formatting | **Working** | High | Bold, Italic, Underline, Fonts, Text Colors. |
| | Dynamic Headings (H1-H4)| **Working** | High | Sized perfectly to fit the 36px rules. |
| | Checklist / Task items | **Working** | High | Interactive lists saved as GFM syntax (`- [x]`). |
| | Tables Insert / Edit | **Working** | High | Insert grid tables with right-click cell formatting. |
| **Notebook Grid** | Ruled Layout background | **Working** | High | Invariant 36px background grid lines. |
| | Plain Layout background | **Working** | High | Invariant clean white sketching sheet background. |
| **Outline Tree** | Related Branches | **Working** | High | Nest lines of text with Shift+Enter curves behind. |
| | Collapsible Headers | **Working** | High | Hiding or expanding child trees with chevrons. |
| **Floating Overlay** | Sticky Notes | **Working** | High | Draggable, resizable sticky cards with palettes. |
| | Image Attachments | **Working** | High | Draggable, resizable images inside visual layers. |
| | Floating Text Blocks | **Working** | High | Draggable text blocks with nested editors. |
| **Visual Graph** | Smart Anchor Links | **Working** | High | Connecting floating objects with auto-routing lines. |
| | Connections styling | **Working** | High | Thickness, dashed lines, and custom colors. |
| **App Services** | debounced Autosave | **Working** | High | debounced 100ms async disk saves. |
| | Session Auto-Restore | **Working** | High | Restores screen, zoom, and scroll position on boot. |
| | File search and replace | **Working** | High | Finds keywords and inserts replacements. |
| | PNG / PDF Exporter | **Working** | High | High-res print cloning with theme presets. |
| **Experimental** | Freehand Ink Drawing | **Incomplete** | Medium | Toolbar shows Pen, Highlighter, and Eraser buttons, but no drawing coordinates are captured or drawn on the paper. `isDrawing` and `drawingCanvasRef` are dead code. |
| **Deprecated** | Multi-page Notebooks | **Deprecated**| High | Old multi-page localStorage database sheets are replaced by the direct single-file system editor. |

---

## 2. Status Category Definitions
- **Working**: Fully implemented, tested, and optimized.
- **Partially Working**: Core functionality exists but contains edge cases or minor performance bottlenecks.
- **Broken**: Crashes during runtime or throws uncaught exceptions. (None present currently).
- **Experimental / Incomplete**: UI shell elements exist (buttons, states) but underlying logic is not yet implemented or connected.
- **Deprecated**: Replaced by a newer architectural design and remains as legacy code.
