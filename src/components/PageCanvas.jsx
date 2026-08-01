import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Highlight } from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { TextAlign } from '@tiptap/extension-text-align';

import EditorToolbar from './EditorToolbar';
import StickyNoteComponent from './StickyNoteComponent';
import { PAGE_SIZES } from '../utils/notebookStorage';

export default function PageCanvas({
  activePage,
  onUpdatePageTitle,
  onUpdatePageContent,
  onUpdateStickyNote,
  onDeleteStickyNote,
  onAddStickyNote,
  onChangePageSize,
  paperRef
}) {
  if (!activePage) return null;

  // Compute paper dimensions based on size selection
  const sizeConfig = PAGE_SIZES[activePage.size] || PAGE_SIZES.A4;
  const paperWidth = activePage.size === 'Custom' ? activePage.customWidth : sizeConfig.width;
  const paperHeight = activePage.size === 'Custom' ? activePage.customHeight : sizeConfig.height;

  // Initialize TipTap Rich Text Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] })
    ],
    content: activePage.content || '',
    onUpdate: ({ editor }) => {
      onUpdatePageContent(activePage.id, editor.getHTML());
    }
  });

  // Keep editor content synchronized when active page changes
  useEffect(() => {
    if (editor && activePage) {
      const currentHTML = editor.getHTML();
      if (currentHTML !== activePage.content) {
        editor.commands.setContent(activePage.content || '');
      }
    }
  }, [activePage.id]);

  return (
    <div className="canvas-viewport">
      {/* Floating Minimalist Toolbar */}
      <EditorToolbar 
        editor={editor} 
        activePage={activePage}
        onAddStickyNote={() => onAddStickyNote(activePage.id)}
        onChangePageSize={onChangePageSize}
      />

      {/* Notebook Paper Container */}
      <div 
        ref={paperRef}
        className={`notebook-paper ${activePage.type === 'ruled' ? 'ruled-page' : 'blank-page'}`}
        style={{
          width: `${paperWidth}px`,
          minHeight: `${paperHeight}px`,
        }}
      >
        <div className="paper-inner">
          {/* Editable Page Title */}
          <input 
            type="text"
            className="page-title-input"
            value={activePage.title || ''}
            onChange={(e) => onUpdatePageTitle(activePage.id, e.target.value)}
            placeholder="Untitled Page"
          />

          {/* TipTap Rich Text Content */}
          <EditorContent editor={editor} />

          {/* Floating Sticky Notes Overlay */}
          {activePage.stickyNotes && activePage.stickyNotes.map((note) => (
            <StickyNoteComponent
              key={note.id}
              note={note}
              onUpdate={(noteId, data) => onUpdateStickyNote(activePage.id, noteId, data)}
              onDelete={(noteId) => onDeleteStickyNote(activePage.id, noteId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
