# File Display System

The file viewer lives in `src/features/files/`. It serves `/project/:rid/file/:fileRid` (a file
inside a desk) and `/files/:rid` (a file on its own, e.g. from a search across desks).

**Verified from:** `src/app/router.js`, `src/features/files/FileViewer.vue`

## Layout

```
             | BrowseBar (path, position, previous/next, close)    |
LineagePanel | display for the file type (or the ROI editor)      | FileToolsPanel
```

The lineage and tools panels run the full height, like the panels beside the set view; the bar
sits above the file only and looks like the bar of the set view (`ui/BarHeader.vue`).

- **BrowseBar** shows the path to the file as a breadcrumb (`ui/BreadcrumbTrail.vue`, the same as the
  set view): **Set › file.pdf › file** (or **search query › file**), the position (`3 / 12`),
  previous/next and close. Every step of the path but the last is a button that goes back to it: the set
  (`?openSet=`), the PDF inside the set (`&openOrigin=`), or the Search/Tags results. There is no separate
  "Back to set" button. Close always goes to the desk. Without a browse context it shows the file name
  and close.
- A file that was deleted from disk (`_file_removed`, an original PDF after splitting) shows a "This file
  was deleted" message instead of a display, and the tools panel is hidden.
- **LineagePanel** shows the path the file came from (`getNodePath`), without users and sets.
  Clicking an earlier file opens it beside the browsed file (side by side, see below), or in its place when the setting is off, and remembers the lineage offset. A file that was deleted
  from disk is drawn faded and struck through with "File deleted after splitting" and cannot be opened.
- **FileToolsPanel**: file name, description (edited in place), metadata, Open file, Regenerate thumbnail (images only, not for references; asks the backend to make the thumbnail again, which fixes a broken one),
  Quick edits, Tags (add from the desk's tag types; new tags are made in Tag admin; the applied tags are listed last, below the tag types, so the types keep their place while tagging; remove with the chip's close button; the chip tooltip says who tagged), and "Show as
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
  of that screen (recorded by `useFileOpener`), so the search step of the path goes back to Tags or Search,
  global or in a desk, with the screen's own state restored from `pageMemory`. `kind` (`search` or
  `tags`) picks the chip icon.
- Arrow keys step too, except while typing in a field.

**Lineage offset:** when the user opens an ancestor (or descendant) of the browsed file in the
lineage panel, the viewer remembers how many file steps away it is. Previous/next then show the file
at the same offset from each browsed file, e.g. the OCR result of every page in a set.
`useFileViewer.js` holds this (`contextRid`, `offset`).

**Side by side:** by default (user setting `lineage_compare`, `on`; the compare button in the lineage
panel's header switches it for the view on screen, `fileBrowse.sideBySide`) a file picked in the lineage
opens *beside* the browsed file instead of replacing it: the picked file (the source) on the left, the
browsed file on the right, each pane with a small header (file name, level, close). The browsed file keeps
its own display, so the OCR, polygon and ROI displays keep their overlays, while the picked file is shown
with the plain display of its type. The tools panel folds away while two files are shown and comes back
when the second pane closes. Clicking the same lineage file again, the browsed file, or the pane's close
button returns to one pane. `useFileViewer.js` keeps the level in `nav.compareOffset` (1 = parent), loads
the file into `fileBrowse.compare`, and writes it to the URL (`?compare=1`) so a reload or a shared link
keeps the comparison. Previous/next keep the level: each browsed file gets the ancestor at the same level,
and a pane says "No file here" when a file's lineage is shorter. With the setting off the old behaviour
(replace + lineage offset above) applies.

**Verified from:** `src/features/files/useFileViewer.js`, `FileViewer.vue`, `LineagePanel.vue`, `browseQuery.js`, `lineage.js`

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
