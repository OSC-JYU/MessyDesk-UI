# Non-Obvious Behavior & Gotchas

This page documents behavior that is correct but surprising, or patterns that could trip up developers unfamiliar with the codebase.

## 1. Node Type Comes From Backend, Not File Extension

The `file.type` field is assigned by the backend after processing. A file named `output.json` might have type `ner.json`, `ocr.json`, or just `json` depending on what produced it. The display dispatcher uses `file.type` first, falling back to extension only when type doesn't match.

**Implication:** Never rely on filename to determine rendering logic. The same `.json` extension can map to completely different display components.

**Verified from:** `src/components/displays/FileDisplayWrapper.vue` (`typeMap` lookup order)

## 2. `#` Stripping is Manual and Pervasive

ArcadeDB RIDs include a `#` prefix (`#21:5`). Every API method in `web.js` strips it manually with `.replace('#','')` before building URLs. This is done per-call, not centralized. Missing a strip would produce invalid URLs.

**Verified from:** `src/web.js` (every method)

## 3. SSE Reconnection Resets State

When SSE reconnects after a failure, there's no mechanism to replay missed events. If a node was added during the disconnection window, the graph won't show it until the next full reload (triggered by `store.reload()`).

**Verified from:** `src/components/GraphDisplay.vue` (`connectSSE`)

## 4. `GraphDisplay` Uses `keep-alive`

The `GraphDisplay` component is cached via `<keep-alive>` when navigating to search/entities/file views within a project. This means:
- The VueFlow instance stays mounted
- SSE connection stays open
- Batch polling continues
- Returning to graph view shows stale data unless an SSE event triggered an update

**Verified from:** `src/components/GraphMain.vue` (template)

## 5. Position Persistence on Drag (100px Grid Snap)

Dragging a node snaps its position to a 100px grid: `Math.round(position/100)*100`. This happens client-side before saving. If the backend stores sub-grid positions, they'll be overwritten on next drag.

**Verified from:** `src/components/GraphDisplay.vue` (`onNodeDragStop`)

## 6. Concurrent Dialog Opening is Possible

Store flags like `uploader_open`, `crunchers_open`, etc. are independent booleans. Nothing prevents multiple dialogs from being `true` simultaneously. In practice this rarely happens due to UI flow, but programmatic state manipulation could cause it.

**Verified from:** `src/components/Store.js`

## 7. `web.search()` Falls Back Silently on Project Filter Failure

If the backend doesn't support project-scoped search, the search method retries without the filter and tags the result with `_project_filter_ignored = true`. The UI should (but may not always) indicate to the user that results are unfiltered.

**Verified from:** `src/web.js` (`search` method)

## 8. DOMPurify Applied to Markdown but Not All HTML

`TextDisplay` sanitizes markdown-rendered HTML via `DOMPurify`. However, `HelpMain.vue` renders backend-provided HTML directly (received from `/api/help`) without visible sanitization in the frontend—relying on the backend to serve safe HTML.

**Verified from:** `src/components/displays/TextDisplay.vue`, `src/components/HelpMain.vue`

## 9. Session Check Redirect Uses Path Substring Match

`App.vue` uses `window.location.pathname.includes('login')` to detect the login page. If `VITE_PUBLIC_PATH` contained the string "login", this check would incorrectly match.

**Verified from:** `src/App.vue` (`login` function)

## 10. Two Bootstrap + Vuetify Coexistence

Both frameworks register global styles. Bootstrap's grid system and Vuetify's grid system (`v-row`/`v-col`) coexist. Some components use Bootstrap classes (`row`, `col-12`), others use Vuetify equivalents. Mixing them in the same template can cause layout conflicts.

**Verified from:** `src/App.vue` (imports), component templates

## 11. File Upload Accepts Limited Formats

The uploader restricts accepted file types client-side via the `accept` attribute:
- Node upload: `image/*,.pdf,text/plain,text/markdown,.md,.zip,.html,.json`
- Set upload: `image/*,.pdf,text/plain,.html,.json,.md`

This is purely UI guidance—the backend may accept other formats.

**PDF gating**: When the PDF splitter service (`md-pypdf_fs`) has no active consumers, the uploader disables the Upload button for PDF files and shows a warning. The backend also enforces this with HTTP 503. A "Remove source PDF after import" checkbox (default checked) controls whether the original file is deleted after splitting.

**Verified from:** `src/components/Uploader.vue`

## 12. `current_node` Shape is Polymorphic

`store.current_node` can be:
- A VueFlow node object (from graph click): `{ id, type, data: { label, type, ... }, position }`
- `null` (pane click deselect)
- An object with `{ data: { name: '', type: '' } }` (initial state)

Components that read `current_node` must handle all shapes.

**Verified from:** `src/components/Store.js`, `src/components/GraphDisplay.vue`

## 13. Batch Refresh Continues Even When No Processes Are Running

The 3-second `setInterval` for batch polling runs unconditionally while `GraphDisplay` is mounted (which is always, due to keep-alive). It polls `web.getBatch()` for each entry in `store.running_processes` regardless of whether any are active.

**Verified from:** `src/components/GraphDisplay.vue` (`batchRefreshTimer`)
