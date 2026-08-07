# Library Recommendations

This document lists recommended replacements for libraries in the dependency list that offer substantial improvements in quality, performance, or maintenance overhead.

---

## 1. Native printToPDF (Replacement for html2canvas & jsPDF)

- **Current Implementation**:
  `html2canvas` compiles the styled DOM nodes into a bitmap canvas, which is sliced horizontally and built into sheets inside `jsPDF`.
- **Current Limitations**:
  - **Bitmapped Quality**: The resulting PDF is an image block, meaning text is not selectable, clickable, or searchable.
  - **Memory spikes**: Generates huge master canvas structures that can crash low-spec machines.
  - **Line Splits**: Slices can cut lines of text or images in half across page boundaries.
- **Recommended Library**:
  **Electron Native `webContents.printToPDF(options)` API**.
- **Migration Difficulty**: Medium. Requires moving export coordination to the Electron main process.
- **Benefits**:
  - Crisp, selectable, vector-based PDF files.
  - Automatically handles standard page splitting.
  - Files are extremely small (KBs instead of multi-megabyte image PDFs).
  - Bypasses rendering thread locks.

---

## 2. In-house Bezier Solvers (Replacement for @xyflow/react)

- **Current Implementation**:
  Imports `getBezierPath`, `getSmoothStepPath`, and `getStraightPath` from `@xyflow/react` to draw connection arrows.
- **Current Limitations**:
  Imports a heavy flow canvas library to use only three mathematical helper functions.
- **Recommended Option**:
  **Custom SVG path generators** written directly in utilities.
- **Migration Difficulty**: Low. The path formulas (quadratic and cubic bezier curves) are standard and can be implemented in ~30 lines of code.
- **Benefits**:
  - Removes the `@xyflow/react` package dependency.
  - Speeds up package installation and build compilation.
