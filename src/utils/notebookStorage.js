// Page Size Presets (in Pixels at standard 96 DPI / high-res rendering)
export const PAGE_SIZES = {
  A4: { label: 'A4 Paper (794 × 1123 px)', width: 794, height: 1123 },
  A5: { label: 'A5 Paper (559 × 794 px)', width: 559, height: 794 },
  Letter: { label: 'US Letter (816 × 1056 px)', width: 816, height: 1056 },
  Legal: { label: 'US Legal (816 × 1344 px)', width: 816, height: 1344 },
  Square: { label: 'Square Canvas (800 × 800 px)', width: 800, height: 800 },
  Custom: { label: 'Custom Dimensions', width: 800, height: 1000 }
};

export const INITIAL_NOTEBOOK = {
  id: 'notebook-01',
  name: 'My Fluent Notebook',
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
  activePageId: 'page-01',
  pages: [
    {
      id: 'page-01',
      title: 'Welcome to FluentNotes 🚀',
      type: 'ruled', // Permanently ruled page
      size: 'A4',
      customWidth: 794,
      customHeight: 1123,
      isFavorite: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stickyNotes: [
        {
          id: 'sticky-1',
          x: 520,
          y: 120,
          color: 'yellow',
          content: '💡 Tip: Click on any page tab or use search to jump instantly!'
        }
      ],
      content: `
        <h1>Experience Modern Windows Note-Taking</h1>
        <p>FluentNotes is built for high performance, distraction-free productivity, and elegant typography using <strong>Fredoka</strong> and <strong>Playpen Sans</strong> fonts.</p>
        <p></p>
        <h2>✨ Key Features Included:</h2>
        <ul data-type="taskList">
          <li><input type="checkbox" checked /> <strong>Ruled & Blank Page Backgrounds</strong> — Choose your preferred notebook layout.</li>
          <li><input type="checkbox" checked /> <strong>Dynamic Paper Sizes</strong> — Switch between A4, A5, Letter, Legal, Square, or Custom dimensions smoothly.</li>
          <li><input type="checkbox" checked /> <strong>Rich Text Editing</strong> — Formatting, tables, image uploads, checklists, sticky notes, and colored highlights.</li>
          <li><input type="checkbox" checked /> <strong>Pristine PDF & Image Exports</strong> — High-resolution export with notebook lines preserved!</li>
          <li><input type="checkbox" checked /> <strong>Instant Autosave & Custom File Format</strong> — Never lose a single keystroke. Save as <code>.notebook</code> project files anytime.</li>
        </ul>
        <p></p>
        <h2>📊 Sample Project Table</h2>
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th>Status</th>
              <th>Priority</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Fluent Design Top Header</td>
              <td>Completed ✅</td>
              <td>High</td>
            </tr>
            <tr>
              <td>Floating Minimal Toolbar</td>
              <td>Completed ✅</td>
              <td>High</td>
            </tr>
            <tr>
              <td>Smooth Page Transitions</td>
              <td>Completed ✅</td>
              <td>Medium</td>
            </tr>
          </tbody>
        </table>
        <p></p>
        <blockquote class="custom-quote">"Simplicity is about subtracting the obvious and adding the meaningful." — John Maeda</blockquote>
      `
    },
    {
      id: 'page-02',
      title: 'Creative Brainstorming 🎨',
      type: 'blank', // Permanently blank (unruled) page
      size: 'Letter',
      customWidth: 816,
      customHeight: 1056,
      isFavorite: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      stickyNotes: [
        {
          id: 'sticky-2',
          x: 480,
          y: 90,
          color: 'blue',
          content: '🎨 Blank Page Mode is completely clean white without any grid lines.'
        }
      ],
      content: `
        <h1>Blank Page Concept Sketch</h1>
        <p>Use blank pages for diagramming, freeform writing, mind mapping, and unconstrained design notes.</p>
        <p></p>
        <p>High quality vector-like crispness with custom image attachments and sticky notes.</p>
      `
    }
  ]
};

const STORAGE_KEY = 'fluent_notebook_data_v1';

export function loadSavedNotebook() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.pages && parsed.pages.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse saved notebook:', e);
  }
  return INITIAL_NOTEBOOK;
}

export function saveNotebookToStorage(notebook) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notebook));
  } catch (e) {
    console.error('Failed to save notebook to localStorage:', e);
  }
}
