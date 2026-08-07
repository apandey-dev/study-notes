# Data Models & Schemas

This document lists the JSON schemas, state objects, and database formats.

---

## 1. Notes Disk Serialization Format

Note documents on disk (.md or .txt files) contain the raw text content edited inside Tiptap, followed by a metadata HTML comment containing the serialized `objects` list representing the floating visual elements and connections:

```markdown
# Note Title
This is the standard document text.

<!-- FLOATING_OBJECTS_DATA: [
  {
    "id": "card-1",
    "type": "sticky",
    "x": 250,
    "y": 140,
    "width": 200,
    "height": 150,
    "content": "<p>Review this formula</p>",
    "color": "#FEF9C3"
  },
  {
    "id": "conn-1",
    "type": "connection",
    "fromId": "card-1",
    "toId": "card-2",
    "fromHandle": "auto",
    "toHandle": "auto",
    "lineStyle": "solid",
    "color": "#3B82F6",
    "thickness": 2
  }
] -->
```

---

## 2. Floating Object Schema (`objects` Array)

The global `objects` list stores both the visual object cards and the connection lines linked to them.

### A. Card Object Elements (`type: 'text' | 'sticky' | 'image'`)
```json
{
  "id": "String (unique UUID or prefix-number)",
  "type": "String ('text' | 'sticky' | 'image')",
  "x": "Number (x coordinate in pixels relative to sheet)",
  "y": "Number (y coordinate in pixels relative to sheet)",
  "width": "Number (width in pixels)",
  "height": "Number (height in pixels)",
  "content": "String (HTML text content - present in 'text' and 'sticky')",
  "src": "String (Base64 data URL - present in 'image')",
  "color": "String (Hex background color - present in 'sticky')",
  "textColor": "String (Hex text color override - present in 'sticky')",
  "zIndex": "Number (layer stacking order)"
}
```

### B. Connection Object Elements (`type: 'connection'`)
```json
{
  "id": "String (unique connection ID)",
  "type": "String ('connection')",
  "fromId": "String (source card object ID)",
  "toId": "String (target card object ID)",
  "fromHandle": "String ('top' | 'bottom' | 'left' | 'right' | 'auto')",
  "toHandle": "String ('top' | 'bottom' | 'left' | 'right' | 'auto')",
  "lineStyle": "String ('solid' | 'dashed')",
  "color": "String (Hex color code override)",
  "thickness": "Number (line stroke width in pixels)",
  "label": "String (Optional connection label text)",
  "arrowStart": "Boolean (Draw arrow at source card)",
  "arrowEnd": "Boolean (Draw arrow at target card)"
}
```

---

## 3. Related Branches Node Schema

Within Layer 2 (TipTap editor body HTML), inline related branch rows are marked up as standard blocks containing metadata attributes:

```html
<p data-branch-id="UUID-1" data-branch-parent="UUID-0" data-branch-level="1" data-branch-collapsed="true">
  This is a child line of text
</p>
```

- **`data-branch-id`**: Unique UUID assigned to the line block.
- **`data-branch-parent`**: Binds the line to its parent block's unique ID.
- **`data-branch-level`**: Integer depth count (0, 1, 2, ...).
- **`data-branch-collapsed`**: (Optional) Flag set to `"true"` if the parent node is folded, hiding all children from the view.

---

## 4. Local App Config Schema (`config.json`)

Saved inside `%APPDATA%/Study Notes/config.json`:

```json
{
  "theme": "String ('light' | 'dark')",
  "windowBounds": {
    "width": "Number (width in pixels)",
    "height": "Number (height in pixels)",
    "x": "Number (screen position x)",
    "y": "Number (screen position y)"
  },
  "isMaximized": "Boolean",
  "updatedAt": "String (ISO Date String)"
}
```
