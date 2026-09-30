# File Display System

The file viewer lives in `src/features/files/`. It serves `/project/:rid/file/:fileRid` (a file
inside a desk) and `/files/:rid` (a file on its own, e.g. from a search across desks).

**Verified from:** `src/app/router.js`, `src/features/files/FileViewer.vue`

## Layout

```
BrowseBar      set or result-list position, previous/next, back, close
LineagePanel | display for the file type (or the ROI editor) | FileToolsPanel
```

- **BrowseBar** shows the set name or search query, the position (`3 / 12`), previous/next, "Back
  to set" / "Back to results" and close. Without a browse context it shows the file name and close.
- **LineagePanel** shows the path the file came from (`getNodePath`), without users and sets.
  Clicking an earlier file opens it and remembers the lineage offset (see below).
- **FileToolsPanel**: file name, description (edited in place), metadata, Open file, Refresh,
  Tags (add from the entity types, remove with the chip's close button), Quick edits, and "Show as
  Markdown" for text files.

## Which display shows a file

`fileTypes.displayFor(file)` picks a display name by `file.type` first, then `file.extension`, and
falls back to `json`. `displays/index.js` maps the names to components, each loaded on first use.

| Type / extension | Display | Notes |
| --- | --- | --- |
| `image` | `ImageDisplay` | Preview from `/api/thumbnails/<path>`; rotation preview and crop rectangle for quick edits |
| `pdf` | `PdfDisplay` | The file in an iframe |
| `text`, `html`, `json`, `csv`, `.txt` | `TextDisplay` | Plain text, or Markdown sanitised with DOMPurify; in-place editing |
| `ocr.json` | `OcrDisplay` | Source image (from `getFileAncestors`) and text pieces; hovering a piece marks it on the image |
| `polygons.json` | `LineSegmentsDisplay` | Line polygons over the source image, zoom and pan (`usePanZoom`) |
| `human.json` | `HumanJsonDisplay` | Face boxes on the source image and per-face details |
| `similarity.json` | `SimilarityDisplay` | Original text, query text and matches (`similarity.js`) |
| `.hocr` | `HocrDisplay` | Page image and hOCR lines with image strips; clicking a word makes it editable (not saved) |
| anything else, `osd.json`, `dspace7.json` | `JsonDisplay` | Pretty-printed JSON or text |

Derived files (OCR, hOCR, face data) find their image with `sourceImage.js` / `getFileAncestors`
instead of reading ids from the URL. The data parsing of each display is in a plain module with unit
tests (`ocr.js`, `lineSegments.js`, `hocr.js`, `similarity.js`, `roi/geometry.js`).

**Verified from:** `src/features/files/fileTypes.js`, `src/features/files/displays/`

## Browsing

The open file and its browse context are in `stores/fileBrowse.js` (`file`, `context`); the old
store's `store.file` / `store.file_browse_context` point at them.

- **Set mode** (`{ mode: 'set', set_rid, set_label, file_count, skip, source_rid, source_label }`,
  `skip` 0-based) is also written to the URL (`browseMode=set&setRid=…&skip=…`), so a reload keeps
  it. Previous/next fetch the neighbouring file with `getSetFiles(set, skip, 1)`.
- **Search mode** (`{ mode: 'search', query, results: [{ rid, label, score, highlight }], index, returnTo, kind }`)
  steps through the result list the Search or Tags screen handed over. `returnTo` is the full path
  of that screen (recorded by `useFileOpener`), so "Back to results" goes back to Tags or Search,
  global or in a desk, with the screen's own state restored from `pageMemory`. `kind` (`search` or
  `tags`) picks the chip icon.
- Arrow keys step too, except while typing in a field.

**Lineage offset:** when the user opens an ancestor (or descendant) of the browsed file in the
lineage panel, the viewer remembers how many file steps away it is. Previous/next then show the file
at the same offset from each browsed file, e.g. the OCR result of every page in a set.
`useFileViewer.js` holds this (`contextRid`, `offset`).

**Verified from:** `src/features/files/useFileViewer.js`, `browseQuery.js`, `lineage.js`

## Quick edits

`useQuickEdit.js`: images can be rotated (preview only until saved) and cropped (draw one rectangle;
mapped to original image pixels); text files are edited in place. Saving creates a new file version
(`createFileVersion`), remakes the thumbnail and reloads the file; "Revert quick edit" restores the
previous version. Reference files (`ref` / `ref_rid`) cannot be edited.

## ROI editor

When a region-of-interest set is opened from the desk, `fileBrowse.roiTarget` (the old store's
`filter_editor`) holds it and the viewer shows `roi/RoiEditor.vue` instead of the display and tools.
Regions are rectangles, circles and polygons stored in percent of the image, saved per image and ROI
set with `saveImageROIs` / `updateImageROI` / `deleteImageROI` (auto-save on by default).

**Verified from:** `src/features/files/roi/`
