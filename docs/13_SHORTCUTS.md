# Keyboard Shortcuts & Slash Commands

This document lists all built-in hotkeys, shortcuts, and input accelerator commands.

---

## 1. Application Keyboard Hotkeys

These shortcuts are captured by custom keymap extensions inside the editor canvas:

| Shortcut | Context | Action | Behavior Details |
|---|---|---|---|
| **`Shift + Enter`** | Editor body | Create Related Line | Splitting the active line creates a child node linked to the parent line, increasing indentation. |
| **`Control + b`** / **`Mod + b`** | Text selection | Bold Toggle | Toggles bold styling on selection. |
| **`Control + i`** / **`Mod + i`** | Text selection | Italic Toggle | Toggles italic styling on selection. |
| **`Control + u`** / **`Mod + u`** | Text selection | Underline Toggle | Toggles underline styling on selection. |
| **`Tab`** | List Item | Indent List | Indents / Sinks list nodes (`listItem` or `taskItem`). |
| **`Tab`** | Paragraph | Insert Spaces | Inserts 4 non-breaking spaces (`&nbsp;&nbsp;&nbsp;&nbsp;`). |
| **`Shift + Tab`** | List Item | Outdent List | Outdents / Lifts list nodes. |
| **`Control + f`** | Editor viewport | Open Search | Displays the keyword Search & Replace overlay. |
| **`Escape`** | App overlays | Cancel / Close | Closes search overlays, popups, or cancels floating objects placement mode. |

---

## 2. Inline Slash Commands (`/` or `..`)

Typing `/` or `..` at the beginning of a blank line displays the autocomplete menu. Selecting or typing the keyword converts the line structure:

| Trigger Syntax | Alternative | Feature Inserted | Command Behavior |
|---|---|---|---|
| **`/h1`** | **`..h1:`** | Heading Level 1 | Converts current line block to H1 element. |
| **`/h2`** | **`..h2:`** | Heading Level 2 | Converts current line block to H2 element. |
| **`/h3`** | **`..h3:`** | Heading Level 3 | Converts current line block to H3 element. |
| **`/h4`** | **`..h4:`** | Heading Level 4 | Converts current line block to H4 element. |
| **`/bullet`** / **`/list`** | **`..list:`** | Bulleted List | Spawns a standard unordered list. |
| **`/number`** / **`/ordered`**| **`..ordered:`** | Numbered List | Spawns an ordered decimal list. |
| **`/todo`** / **`/task`** | **`..todo:`** | Task Checklist | Spawns a checklist containing checkbox elements. |
| **`/table`** | **`..table:`** | Table Grid | Spawns a custom interactive table. |
| **`/blockquote`** / **`/quote`**| **`..quote:`** | Quote Block | Inserts a styled blockquote element. |
| **`/code`** | **`..code:`** | Code Block | Inserts a preformatted code snippet box. |
