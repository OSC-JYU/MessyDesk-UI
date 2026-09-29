# Graph Visualization

A desk is shown as a graph of files, sets, sources and the processing steps between them, drawn with
Vue Flow (`@vue-flow/core`) and laid out left to right with dagre. The code is in
`src/features/project/`.

## Pieces

| File | Does |
| --- | --- |
| `ProjectWorkspace.vue` | `/project/:rid` shell: drawer, graph + node panel, child routes, dialogs; creates the workspace |
| `useWorkspace.js` | Shared state of the desk (selected node, reload, dialogs) and the actions that change it |
| `GraphCanvas.vue` | Vue Flow canvas, view controls, the set browser |
| `useDeskGraph.js` | Loads the graph (`getProject`), lays it out, applies SSE updates, isolate / hide processes |
| `graphModel.js` | API graph → Vue Flow nodes/edges, dagre layout, update merging, nodes from "add" events |
| `nodeKinds.js` | What kind of node something is; finding the source of an ROI set |
| `useOpenNode.js` | Double-click: file → file viewer, set → set browser, ROI set → ROI editor |
| `SetBrowser.vue` | A set's files, paged from the server (10 per page), shown with the search results grid |
| `nodes/` | Node components on a shared `NodeShell` (header, cookie button, handles) |
| `panel/` | Node panel: label and description editing, tools, process details |
| `dialogs/` | Crunchers, delete node, create set, create source, uploads |

## Node types

`nodes/index.js` maps Vue Flow node types to components; `graphModel.toFlowNode` sets the node type
from the backend's file type, and unknown file types get `file`.

| Node type | Component |
| --- | --- |
| `text`, `csv`, `html`, `json`, `data` and result types (`ocr.json`, `ner.json`, `human.json`, `polygons.json`, `faiss.json`, `error.json`, …) | `FileNode` |
| `image` | `ImageNode` (thumbnail, size, regions count and ROI cruncher button) |
| `pdf` | `PdfNode` |
| `process`, `setprocess`, `filter` | `ProcessNode` (status, service, model, error) |
| `set` | `SetNode` (count, preview grid or text samples) |
| `roi-set` | `RoiSetNode` |
| `search-set` | `SearchSetNode` |
| `nextcloud`, `dspace7` | `SourceNode` |
| `zip` | `ZipNode` |
| `empty` | `EmptyDeskNode` (empty desk, with an upload button) |

Node components set `inheritAttrs: false`: Vue Flow passes props such as `label` that would otherwise
fall through onto the frame and override it.

## Live updates

`services/events.js` keeps one SSE connection and re-dispatches every event as a `md-sse` window
event. `useDeskGraph` handles:

- `add`, `add_and_finish` — add the node, the edge from its input and, for a process with an output,
  its output set (marked running); re-layout and fit to the new node. Files uploaded into a set are not
  drawn.
- `update` — merge changed fields (label, status, thumbnails, counts, …) into the node.
- `process_update`, `process_finished` — update the process and its set.

Batch progress (`batch_*` events) goes to `stores/batchStore.js` and the floating jobs panel
(`features/jobs/JobsPanel.vue`).

## Views

- **Isolate** shows only the selected node and everything above and below it.
- **Hide processes** hides `process` nodes and connects their inputs straight to their outputs.
- Dragging a node saves its position snapped to a 100 px grid (not used for drawing; the layout is
  recomputed on load).
