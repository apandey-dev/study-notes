# Unused Code Audit

This document inventories all orphaned files, dead components, unused packages, and legacy modules in the codebase.

---

## 1. Unused Files & Components
These files were created for an earlier, database-centric, multi-page notebook architecture. They are completely orphaned and not imported by any active application component:

1. **[`src/components/PageCanvas.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/PageCanvas.jsx)**:
   - *Status*: Unused.
   - *Purpose*: Old React editor canvas component that read page objects from `notebookStorage.js` and rendered a simplified Tiptap editor.
2. **[`src/components/EditorToolbar.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/EditorToolbar.jsx)**:
   - *Status*: Unused.
   - *Purpose*: Old floating formatting toolbar that sat on top of `PageCanvas.jsx`.
3. **[`src/components/EmptyState.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/EmptyState.jsx)**:
   - *Status*: Unused.
   - *Purpose*: Landing screen displayed when a note had no pages.
4. **[`src/components/NewPageModal.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/NewPageModal.jsx)**:
   - *Status*: Unused.
   - *Purpose*: Modal form prompting for page titles and dimensions.
5. **[`src/components/ChoosePageTypeModal.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/ChoosePageTypeModal.jsx)**:
   - *Status*: Unused.
   - *Purpose*: Popup dialog to select between Ruled Page and Blank Page type formats.
6. **[`src/components/PageManagementModal.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/PageManagementModal.jsx)**:
   - *Status*: Unused.
   - *Purpose*: Page organizer panel for arranging, renaming, deleting, or sorting pages within a single notebook database block.
7. **[`src/components/StickyNoteComponent.jsx`](file:///C:/Users/arpit/Desktop/study-notes/src/components/StickyNoteComponent.jsx)**:
   - *Status*: Unused.
   - *Purpose*: Individual sticky note widget used exclusively by the legacy `PageCanvas.jsx`. (Active editor relies on `FloatingObjectLayer.jsx` which renders sticky notes inline).

---

## 2. Unused Utilities & Store Files
- **[`src/utils/notebookStorage.js`](file:///C:/Users/arpit/Desktop/study-notes/src/utils/notebookStorage.js)**:
  - *Status*: Unused.
  - *Purpose*: Managed the local storage cache (`fluent_notebook_data_v1`) of mock notebook sheets. The current implementation uses direct file mapping (`Documents` directory MD/TXT files) and is completely independent of this store.

---

## 3. Unused NPM Packages
- **`canvas-confetti`** (`^1.9.4`):
  - *Status*: Unused.
  - *Purpose*: Installed in dependencies but never imported or invoked in any active javascript files.

---

## 4. Risks & Recommendations
- **Recommendation**: After securing approval, all 7 unused components, the legacy `notebookStorage.js` utility, and the `canvas-confetti` NPM package dependency should be deleted to optimize workspace size and bundle resolving speed.
- **Risk of deletion**: **Very Low**. None of these files are imported or referenced anywhere in active code paths.
