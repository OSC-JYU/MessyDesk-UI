# File Display System

## Architecture

File viewing uses a three-column layout orchestrated by `FileDisplayWrapper.vue`:

```
┌──────────┬──────────────────────────┬──────────┐
│ PathPanel│     Content Display      │FileTools │
│ (col 2)  │     (dynamic component) │ (col 2)  │
│          │                          │          │
│ Ancestry │  Selected by file.type   │ Tags     │
│ tree     │  and file.extension      │ Edits    │
│          │                          │ Settings │
└──────────┴──────────────────────────┴──────────┘
```

Both side columns are collapsible.

**Verified from:** `src/components/displays/FileDisplayWrapper.vue` (template)

## Type Dispatch

`FileDisplayWrapper` selects the center display component using two lookup tables:

### Primary lookup: `typeMap` (by `file.type`)

| Type | Component |
|------|-----------|
| `image` | `MultiDisplay` |
| `pdf` | `PDFDisplay` |
| `text` | `TextDisplay` |
| `html` | `TextDisplay` |
| `json` | `TextDisplay` |
| `csv` | `TextDisplay` |
| `ocr.json` | `OCRDisplay` |
| `polygons.json` | `LineSegmentationDisplay` |
| `osd.json` | `OSDDisplay` |
| `human.json` | `HumanJSONDisplay` |
| `dspace7.json` | `TextRawDisplay` |
| `similarity.json` | `SimilarityDisplay` |

### Fallback lookup: `extensionMap` (by `file.extension`)

| Extension | Component |
|-----------|-----------|
| `hocr` | `HOCRDisplay` |
| `json` | `JSONDisplay` |
| `txt` | `TextDisplay` |

### Default
If neither lookup matches, `JSONDisplay` is used.

**Verified from:** `src/components/displays/FileDisplayWrapper.vue` (`typeMap`, `extensionMap`, `displayComponent` computed)

**Important invariant (from memory):** Display routing must use the database-backed `file.type` field rather than mutable labels/filenames, since users may relabel files.

## Key Display Components

### MultiDisplay (Images)
- Shows the image with rotation support
- Supports crop mode (user draws a rectangle selection)
- Emits `crop-selection-change` events to parent
- Uses `thumbnailVersion` prop for cache busting after thumbnail updates

### TextDisplay
- Renders text with optional Markdown rendering (using `marked` + `DOMPurify` for XSS safety)
- Supports inline edit mode (textarea)
- Watches `store.file` changes to reload content

### PDFDisplay
- Uses `vue-pdf-embed` for rendering

### HOCRDisplay
- Dedicated viewer for hOCR (HTML-based OCR) format

**Verified from:** `src/components/displays/MultiDisplay.vue`, `src/components/displays/TextDisplay.vue`

## Context Bar (Top of File View)

Depending on `store.file_browse_context.mode`:
- **`set` mode:** `SetTools` component shows prev/next navigation and "back to set" button
- **`search` mode:** `SearchTools` component shows navigation within search results
- **No context:** A standalone close button appears

**Verified from:** `src/components/displays/FileDisplayWrapper.vue` (template, top section)

## Right Column: FileTools

`FileTools.vue` provides an accordion panel with:
1. **FileInfo** — Always visible; shows file metadata
2. **Tags** — Entity/tag chips for the current file
3. **Quick edits** (conditional) — Version tools: text edit, image rotate/crop, revert
4. **Markdown toggle** — Switch for text files

The "Quick edits" panel only appears for images and editable text types (`text`, `csv`, `html`, `json`).

**Verified from:** `src/components/displays/FileTools.vue`

## Left Column: PathPanel

Shows the file's lineage/ancestry tree. Allows clicking ancestors to navigate.

**Verified from:** `src/components/displays/FileDisplayWrapper.vue` (PathPanel usage)

## File Version Workflow

1. User edits text → saves → calls `web.createFileVersion(rid, payload)` 
2. Backend creates a new version, returns updated file
3. User can revert with `web.revertFileVersion(rid)`
4. For images: rotation/crop → creates version with `operation` and `params` metadata

**Verified from:** `src/web.js` (`createFileVersion`, `revertFileVersion`), `test/components/displays/VersionTools.spec.js`

## ROI Editing Mode

When `store.filter_editor` is set (non-null), the center column renders `ImageROIDisplay` instead of the normal type-dispatched component. This happens when a user double-clicks an ROI-set node and has a source image resolved.

**Verified from:** `src/components/displays/FileDisplayWrapper.vue` (template conditional)
