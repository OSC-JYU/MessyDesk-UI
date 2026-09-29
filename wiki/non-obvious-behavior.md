# Non-Obvious Behavior & Gotchas

This page documents behavior that is correct but surprising, or patterns that could trip up developers unfamiliar with the codebase.

## 1. Node Type Comes From Backend, Not File Extension

The `file.type` field is assigned by the backend after processing. A file named `output.json` might have type `ner.json`, `ocr.json`, or just `json` depending on what produced it. The display dispatcher uses `file.type` first, falling back to extension only when type doesn't match.

**Implication:** Never rely on filename to determine rendering logic. The same `.json` extension can map to completely different display components.

**Verified from:** `src/features/files/fileTypes.js` (`displayFor` lookup order)

## 2. `#` Stripping is Manual and Pervasive

ArcadeDB RIDs include a `#` prefix (`#21:5`). Every API method in `api/client.js` strips it manually with `.replace('#','')` before building URLs. This is done per-call, not centralized. Missing a strip would produce invalid URLs.

**Verified from:** `src/api/client.js` (every method)

## 3. SSE Reconnection Resets State

When SSE reconnects after a failure, there's no mechanism to replay missed events (only batch jobs are re-read with `batchStore.hydrate()`). If a node was added during the disconnection window, the graph won't show it until the next reload (`workspace.reload()`).

**Verified from:** `src/services/events.js`, `src/features/project/useDeskGraph.js`

## 4. The Graph Canvas Uses `keep-alive`

`GraphCanvas` is cached with `<keep-alive>` while moving to the desk's search, tags or file views. The Vue Flow instance stays mounted and keeps applying SSE updates, so returning to the graph shows it as it was, without a reload.

**Verified from:** `src/features/project/ProjectWorkspace.vue` (template)

## 5. Position Persistence on Drag (100px Grid Snap)

Dragging a node snaps its position to a 100px grid: `Math.round(position/100)*100`, then saves it with `setProjectAttribute(node, { key: 'position' })`. The graph is still laid out with dagre on load, so saved positions are not used for drawing.

**Verified from:** `src/features/project/useDeskGraph.js` (`onNodeDragStop`)

## 6. Dialogs Are Opened Through the Workspace

The desk's dialogs (crunchers, delete node, create set, create source, uploads) are opened with workspace actions (`useWorkspace()`), not global flags. Uploads are one-shot requests: bumping `dialogs.upload.request` or `dialogs.setUpload.request` makes `UploadController` click a hidden file input.

**Verified from:** `src/features/project/useWorkspace.js`, `dialogs/UploadController.vue`

## 7. `web.search()` Falls Back Silently on Project Filter Failure

If the backend doesn't support project-scoped search, the search method retries without the filter and tags the result with `_project_filter_ignored = true`. The UI should (but may not always) indicate to the user that results are unfiltered.

**Verified from:** `src/api/client.js` (`search` method)

## 8. DOMPurify Applied to Markdown but Not All HTML

`features/files/displays/TextDisplay.vue` sanitizes markdown-rendered HTML via `DOMPurify`. The help pages (`/api/help`, `/api/services/{id}/help`) arrive as whole HTML documents with their own nav and stylesheet. `features/help/helpContent.js` takes the nav links and the article, drops the backend stylesheet (which used to be injected into the app and restyled it globally), and sanitises the article with DOMPurify before `HelpArticle.vue` renders it with the app's styles.

**Verified from:** `src/features/files/displays/TextDisplay.vue`, `src/features/help/helpContent.js`

## 9. Session Check Redirect Uses Path Substring Match

`src/app/App.vue` uses `window.location.pathname.includes('login')` to detect the login page. If `VITE_PUBLIC_PATH` contained the string "login", this check would incorrectly match.

**Verified from:** `src/app/App.vue` (`onLoginPage`)

## 10. Bootstrap Class Names Do Nothing

Bootstrap is no longer installed (stage 8), so classes like `row`, `btn` or `mt-3`-style Bootstrap utilities have no styles of their own. Vuetify has utilities with the same names for spacing (`mt-3`, `pa-2`), which still work. `npm run lint` fails on Bootstrap-only classes. Base margins for headings, paragraphs and lists come from `src/styles/reset.css`.

**Verified from:** `src/app/main.js`, `src/styles/reset.css`, `scripts/check-new-code.mjs`

## 11. File Upload Accepts Limited Formats

The uploader restricts accepted file types client-side via the `accept` attribute:
- Node upload: `image/*,.pdf,text/plain,text/markdown,.md,.zip,.html,.json`
- Set upload: `image/*,.pdf,text/plain,.html,.json,.md`

This is purely UI guidance—the backend may accept other formats.

**Direct-to-picker UX**: Clicking an "Upload" button opens the native file picker straight away (see §6).
For the main-desk (single-file) upload, the file is sent as soon as it's chosen — no confirmation step. For
Set (multi-file) upload, a minimal confirm/progress dialog shows after files are picked (file count,
large-upload and PDF-gating warnings, Upload/Cancel) rather than a file-browsing step.

**PDF gating**: When the PDF splitter service (`md-pypdf_fs`) has no active consumers, the uploader disables
the Upload button (Set flow) or stops with an error message (main-desk flow) for PDF files. The backend also enforces
this with HTTP 503. The original PDF is always deleted after splitting (no user-facing toggle;
`delete_original` defaults to `true` server-side and the UI never overrides it to `false`).

**Verified from:** `src/features/project/dialogs/UploadController.vue`

## 12. The Selected Node Is a Vue Flow Node

`workspace.state.selected` is a Vue Flow node (`{ id, type, data, position }`) or `null`. `node.type` picks the node component (`text`, `image`, `set`, `setprocess`, … and `file` for unknown file types), while `node.data.type` keeps the file type from the backend.

**Verified from:** `src/features/project/graphModel.js`, `nodes/index.js`
