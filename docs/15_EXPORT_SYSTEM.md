# Document Export System

This document explains the cloning, rendering, page-slicing math, and file-saving mechanics of the PNG/PDF export pipeline.

---

## 1. Export Render Architecture

The exporter operates off-screen using a temporary DOM cloning technique inside [`ExportModal.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/ExportModal.jsx) to ensure active user editing remains uninterrupted during file builds:

```
[Active Editor Canvas]
       │
       ▼ (Reads element dimensions & computes max content height)
[Clone DOM Node] 
       │
       ▼ (Strips UI elements like resize handles, connection nodes, menu buttons)
[Apply selected Export Theme]
       │
       ▼ (Renders HTML to bitmap canvas via html2canvas)
[High-Res Master Canvas]
 ┌─────┴────────────────────────────────────────┐
 ▼ (PNG Format)                                 ▼ (PDF Format)
[DataURL string]                               [Slice master canvas by page ratio]
 │                                              │
 ▼                                              ▼ (Stitches slices into pages)
[Prompt System Save Dialog]                    [Invoke jsPDF layout generation]
 │                                              │
 ▼                                              ▼
[Write file via saveFileContent]               [Write binary array to disk]
```

---

## 2. Dynamic Height Calculation

To prevent exporting truncated documents or bloated blank canvases, the engine dynamically calculates the vertical bounds of the document:

```javascript
let maxContentBottom = 500;
const editorElem = sourcePaper.querySelector('.ProseMirror');
if (editorElem) {
  maxContentBottom = Math.max(maxContentBottom, editorElem.offsetTop + editorElem.offsetHeight);
}
const floatingCards = sourcePaper.querySelectorAll('.floating-object-wrapper');
floatingCards.forEach(card => {
  const topVal = parseFloat(card.style.top) || 0;
  const heightVal = parseFloat(card.style.height) || 200;
  maxContentBottom = Math.max(maxContentBottom, topVal + heightVal + 60);
});

const exportWidth = sourcePaper.offsetWidth || 800;
const exportHeight = Math.min(maxContentBottom + 80, 15000);
```

- Loops through the Tiptap editor height and every Layer 3 card's absolute coordinates (`top + height`).
- Sets the master container height (`exportHeight`) to the bottom-most boundary + padding, capped at `15,000px` to prevent canvas memory allocation crashes.

---

## 3. DOM Sanitization & Themes Injections

The clone node is cleaned before rendering to ensure a professional look:

1. **Remove UI Widgets**: Removes resize drag circles, connector nodes, card actions popovers, and sticky toolbars.
2. **Remove Outlines**: Removes CSS border states like `.selected` outlines.
3. **Incorporate Themes**: Injects the selected document theme as a data-attribute (`data-theme`) onto the temporary off-screen container. This applies target styles (Charcoal Dark, Sepia, Sepia Ruled, Blueprint, Graph Paper) via the CSS stylesheet rules.

---

## 4. Multi-page PDF Slicing Math

Because `html2canvas` returns a single tall bitmap representing the entire notebook length, the exporter must slice it horizontally to map to discrete PDF document pages (e.g. A4 ratio):

1. **Calculate Page Ratio**: Reads the physical output width of the target PDF layout page and calculates the equivalent vertical pixel count representing a single page:
   `sliceHeightPx = Math.floor((canvasWidth * pdfHeight) / pdfWidth);`
2. **Page Slicing Loop**:
   - Creates a temporary empty `<canvas>` matching the page width and `sliceHeightPx`.
   - Copies a segment of the master canvas from `currentY` to `currentY + sliceHeightPx` onto the temporary page canvas using `drawImage`.
   - Converts the cropped canvas to a JPEG/PNG data URL.
   - Adds a new sheet inside `jsPDF` (for pages after page 1) and embeds the cropped segment at `(0, 0)` coordinates.
   - Increments `currentY` by `sliceHeightPx` and repeats until the entire canvas length is compiled.
3. **ArrayBuffer disk flush**: Calls `pdf.output('arraybuffer')` and writes the binary stream to disk using `electronAPI.saveFileContent`.
