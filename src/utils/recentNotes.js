const RECENT_KEY = 'study_recent_notes_v1';
const DEFAULT_PAGE_TYPE_KEY = 'study_default_page_type';

export function getRecentNotes() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse recent notes:', e);
  }
  return [];
}

export function addRecentNote(note) {
  if (!note || !note.fileName) return;
  try {
    const list = getRecentNotes();
    const existingIdx = list.findIndex(n => (n.filePath && n.filePath === note.filePath) || n.fileName === note.fileName);
    
    const updatedNote = {
      filePath: note.filePath || null,
      fileName: note.fileName,
      fileFormat: note.fileFormat || (note.fileName.endsWith('.txt') ? 'txt' : 'md'),
      folderPath: note.filePath ? note.filePath.substring(0, note.filePath.lastIndexOf(/[/\\]/)) : 'Local Note',
      lastModified: new Date().toISOString(),
      pageType: note.pageType || getDefaultPageType()
    };

    let newList = [...list];
    if (existingIdx >= 0) {
      newList[existingIdx] = { ...newList[existingIdx], ...updatedNote };
    } else {
      newList.unshift(updatedNote);
    }

    // Keep top 30 recent notes
    newList = newList.slice(0, 30);
    localStorage.setItem(RECENT_KEY, JSON.stringify(newList));
  } catch (e) {
    console.error('Failed to add recent note:', e);
  }
}

export function removeRecentNote(filePathOrName) {
  try {
    const list = getRecentNotes();
    const newList = list.filter(n => n.filePath !== filePathOrName && n.fileName !== filePathOrName);
    localStorage.setItem(RECENT_KEY, JSON.stringify(newList));
    return newList;
  } catch (e) {
    console.error('Failed to remove recent note:', e);
    return [];
  }
}

export function getDefaultPageType() {
  return localStorage.getItem(DEFAULT_PAGE_TYPE_KEY) || 'ruled';
}

export function setDefaultPageType(type) {
  localStorage.setItem(DEFAULT_PAGE_TYPE_KEY, type);
}
