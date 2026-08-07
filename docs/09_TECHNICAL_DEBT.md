# Technical Debt Audit

This document reviews architectural constraints, monolithic code blocks, repetitive logic, and maintenance risks.

---

## 1. Monolithic Component Structures

### 1. `FloatingObjectLayer.jsx` (1,678 lines)
- **Problem**: This component does far too much. It handles:
  - Coordinate tracking for dragging/resizing.
  - Multi-selection boundaries and focus states.
  - Knowledge graph connector lines drawing and path intersections.
  - Render layouts for sticky notes, image boxes, and text block cards.
  - Internal Tiptap editor instances for each text block.
  - Smart auto-arranging nodes math logic.
- **Risk**: Maintaining, styling, or extending card behaviors requires modifying a 1,700-line React component, increasing the risk of introducing layout side-effects.
- **Resolution**: Break it down into modular child components:
  - `StickyCard.jsx`
  - `ImageCard.jsx`
  - `TextBlockCard.jsx`
  - `ConnectionPaths.jsx` (SVG renderer)
  - `autoArrangeSolver.js` (pure utility function)

### 2. `EditorCanvas.jsx` (1,174 lines)
- **Problem**: Manages global layout measurements, coordinates tracking, related branches mouse/move event listeners, scroll sync hooks, context menus, and inline annotations.
- **Resolution**: Move event listeners and measurements into custom hooks (e.g. `useBranchMeasurements.js`, `useGutterDelegation.js`).

---

## 2. Fragile Metadata Serialization
- **Problem**: Floating object coordinates, links, and styling parameters are stored as a serialized JSON string inside an HTML comment at the end of the markdown note (`<!-- FLOATING_OBJECTS_DATA: ... -->`).
- **Risk**: Since the file format is standard `.md`, users can open notes in external editors (VS Code, Notepad, Obsidian). If they modify or delete this comment, or if an external Markdown formatter reformats the file, the JSON metadata block will break, destroying the visual layers.
- **Resolution**: Store notes in a package format (like a `.zip` archive renamed to `.study`, containing a `document.md` file and a `metadata.json` file), or keep the Markdown file standard and maintain a separate hidden sidecar database (`.study-notes-metadata/` folder) next to it.

---

## 3. Duplicated Color Palettes & Styles
- **Problem**: Visual colors like `STICKY_COLORS` (10 items in `FloatingObjectLayer.jsx`) and `PREMIUM_COLORS` (15 items in `Toolbar.jsx`) are defined locally inside components.
- **Resolution**: Create a central design tokens file (`src/utils/themeTokens.js`) exporting these palettes, ensuring consistency across modals, context menus, and toolbars.

---

## 4. Presence of Legacy / Dead Files
- **Problem**: 7 component files and `notebookStorage.js` are dead code. They clutter the file system and increase cognitive load for new developers.
- **Resolution**: Safely delete all orphaned files.
