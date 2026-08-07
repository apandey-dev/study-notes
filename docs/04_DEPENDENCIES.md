# Dependencies Audit

This document catalogs and reviews every package dependency defined in `package.json`.

---

## 1. Production & Development Dependencies

| Library Name | Version | Feature Usage | Purpose & Evaluation | Status |
|---|---|---|---|---|
| **`react`** | `^19.2.8` | Core UI | Main view manager. React 19 provides fast scheduling and transitions. | **Used (Critical)** |
| **`react-dom`**| `^19.2.8` | Core UI | Rendering React nodes to DOM. | **Used (Critical)** |
| **`electron`** | `^43.2.0` | Desktop Shell | encapsulation wrapper for local files, menus, and window states. | **Used (Critical)** |
| **`vite`** | `^8.2.0` | Build Tool | Extremely fast bundler and compiler. | **Used (Critical)** |
| **`@tiptap/react`**| `^3.29.2` | Rich Text Editor | React wrapper for the ProseMirror editor. | **Used (Critical)** |
| **`@tiptap/pm`** | `^3.29.2` | Rich Text Editor | Core ProseMirror state, selection, and history transactions. | **Used (Critical)** |
| **`@tiptap/starter-kit`**| `^3.29.2`| Rich Text Editor | Base node extensions (paragraph, lists, headings). | **Used (Critical)** |
| **`@tiptap/extension-underline`**| `^3.29.2`| Text Format | Underline inline style. | **Used** |
| **`@tiptap/extension-color`**| `^3.29.2`| Text Format | Inline font text coloring. | **Used** |
| **`@tiptap/extension-text-style`**| `^3.29.2`| Text Format | Base extension supporting color and font-family attributes. | **Used** |
| **`@tiptap/extension-highlight`**| `^3.29.2`| Text Format | Background highlight color. | **Used** |
| **`@tiptap/extension-table`** | `^3.29.2`| Table Inserter | Grid-based table manipulation. | **Used** |
| **`@tiptap/extension-table-row`**| `^3.29.2`| Table Inserter | Table row schema. | **Used** |
| **`@tiptap/extension-table-header`**| `^3.29.2`| Table Inserter | Table header cell schema. | **Used** |
| **`@tiptap/extension-table-cell`**| `^3.29.2`| Table Inserter | Table body cell schema. | **Used** |
| **`@tiptap/extension-task-list`**| `^3.29.2`| Checklists | Interactive checklist checkbox arrays. | **Used** |
| **`@tiptap/extension-task-item`**| `^3.29.2`| Checklists | Individual checkbox items. | **Used** |
| **`@tiptap/extension-text-align`**| `^3.29.2`| Paragraph Alignment| Left, right, center alignment. | **Used** |
| **`@tiptap/extension-image`**| `^3.29.2`| Rich Text Editor | Inline image insertion. (Not to be confused with Layer 3 floating images). | **Used** |
| **`@xyflow/react`**| `^12.11.2`| Connections Engine| We only import `getBezierPath`, `getSmoothStepPath`, and `getStraightPath` from it to calculate curves inside SVGs. | **Used (Partially)** |
| **`turndown`** | `^7.2.4` | Autosave | Bidirectional HTML to Markdown parser. | **Used (Critical)** |
| **`marked`** | `^18.0.7` | Note Loading | Fast Markdown to HTML parser. | **Used (Critical)** |
| **`html2canvas`**| `^1.4.1` | Document Export | Captures the layout viewport DOM and compiles it into an image block. | **Used (Critical)** |
| **`jspdf`** | `^4.2.1` | Document Export | Builds PDF files out of captured canvas bitmaps. | **Used (Critical)** |
| **`lucide-react`**| `^1.28.0` | UI Icons | High-quality minimalist stroke vector icons. | **Used (Critical)** |
| **`concurrently`**| `^10.0.4` | Build Scripts | Runs Vite and Electron processes together during development. | **Used** |
| **`electron-builder`**| `^26.0.0` | Packaging | Packs and signs the production NSIS installers. | **Used** |
| **`oxlint`** | `^1.75.0` | Linting | Extremely fast Rust-based linter checking code patterns. | **Used** |
| **`canvas-confetti`**| `^1.9.4` | Unused | Added during setup but never imported or referenced in the active codebase. | **Unused (Dead)** |

---

## 2. Alternatives & Replacements Evaluation

### 1. `@xyflow/react`
- **Evaluation**: We only import mathematical SVG path-drawing helper functions from it, meaning the actual React Flow layout engine is not loaded.
- **Can it be replaced?**: Yes. We can write lightweight geometry helpers (bezier curve solvers) directly in our utilities to completely remove the `@xyflow/react` package dependency, reducing npm resolution steps.

### 2. `canvas-confetti`
- **Evaluation**: Totally dead dependency.
- **Recommendation**: Remove from `package.json` to keep development installations optimized.

### 3. `html2canvas` & `jspdf`
- **Evaluation**: Used for visual PNG/PDF generation. They are heavy libraries but reliable for client-side rendering.
- **Can it be replaced?**: In Electron, we can use the native Chrome print-to-pdf engine (`webContents.printToPDF`) which is faster, produces crisp vector text (not flat bitmaps), handles page breaks automatically, and creates significantly smaller PDF files.
- **Migration Difficulty**: Medium. Would require invoking an IPC call to the main process instead of doing DOM capture in the React thread.
