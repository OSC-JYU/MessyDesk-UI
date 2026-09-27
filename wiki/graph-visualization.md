# Graph Visualization

## Core Technology

The project graph is rendered using `@vue-flow/core` (a Vue 3 wrapper around a React Flow–like API). Layout is computed by `dagre` (hierarchical graph layout algorithm).

**Verified from:** `package.json`, `src/components/GraphDisplay.vue`, `src/components/useLayout.js`

## How the Graph Loads

1. Route change to `/project/:rid` triggers the `watch` on `route.params.rid` in `GraphDisplay.vue`
2. `loadGraph()` calls `web.getGraph(query, current_node, cluster)` with `cluster = 1`
3. Backend returns nodes and edges
4. Nodes are mapped to VueFlow node objects with a `type` property that selects the node renderer
5. `dagre` layout is applied via `useLayout()` → positions are computed
6. VueFlow renders the graph

**Verified from:** `src/components/GraphDisplay.vue`

## Node Type → Renderer Mapping

The `<VueFlow>` template uses named slots to map node types to renderer components:

| VueFlow `type` | Renderer Component | Represents |
|----------------|-------------------|------------|
| `project` | `ProjectNode` | Project root node |
| `image` | `ImageNode` | Image file |
| `process` | `ProcessingNode` | Single-file processing step |
| `setprocess` | `SetProcessingNode` | Set-level processing step |
| `pdf` | `PDFNode` | PDF file |
| `text` | `TextNode` | Text file |
| `data`, `json` | `JSONNode` | Generic JSON data |
| `similarity_results.json` | `JSONNode` | Similarity results |
| `pos.json`, `bow.json` | `JSONNode` | NLP outputs |
| `filter` | `FilterNode` | Image filter result |
| `set` | `SetNode` | File set (collection) |
| `search-set` | `SearchSetNode` | Search-derived set |
| `roi-set` | `SetFilterNode` | ROI-filtered set |
| `dspace7` | `SourceNode` | DSpace7 external source |
| `nextcloud` | `SourceNode` | Nextcloud external source |
| `dspace7.json`, `solr.json` | `JSONNode` | Source metadata |
| `human.json` | `HumanNode` | Human annotation |
| `ner.json` | `NERNode` | Named entity recognition output |
| `zip` | `ZIPNode` | ZIP archive |
| `osd.json` | `OSDNode` | Orientation/script detection |
| `ocr.json` | `OCRNode` | OCR text output |
| `csv` | `TextNode` | CSV file (shown as text) |
| `html` | `HTMLNode` | HTML file |
| `polygons.json` | `PolygonNode` | Line/polygon segmentation |
| `faiss.json` | `SearchNode` | FAISS vector search index |
| `empty` | `EmptyNode` | Empty/placeholder |
| `error.json` | `ErrorNode` | Error result |

**Verified from:** `src/components/GraphDisplay.vue` (template section, lines ~160-310)

## Node Interaction Behaviors

### Single Click
Sets `store.current_node` to the clicked node. Triggers the right-side `NodeCard` panel to show node details.

### Pane Click
Clears `store.current_node` (deselects).

### Drag Stop
Snaps position to 100px grid, persists new position to backend via `PUT /api/projects/:id`.

### Double Click
Complex dispatch logic based on node type:
- **Project node:** navigates to `/project/:rid`
- **Set node:** opens inline SetPanel
- **ROI-set node:** resolves source image and opens ROI editor, or opens source set panel
- **File node (non-zip):** emits `open-node` which triggers file view navigation
- **Other types:** no action

**Verified from:** `src/components/GraphDisplay.vue` (`onNodeDoubleClick` handler)

## Set Panel

When a set node is double-clicked, `GraphDisplay` switches from showing the VueFlow canvas to showing an inline `SetPanel` component. The set panel:
- Loads files paginated (10 per page)
- Supports grouped mode (by source) and flat mode
- Double-clicking a file in the set panel opens it in `FileDisplayWrapper`
- Has back/restore capability via `store.set_panel_cache`

**Verified from:** `src/components/GraphDisplay.vue`, `src/components/displays/SetPanel.vue`

## SSE (Server-Sent Events) Protocol

The `GraphDisplay` component connects to `{apiUrl}/events` using the browser's `EventSource` API. Messages are JSON with a `command` field:

| Command | Effect |
|---------|--------|
| `add` | New node added to graph |
| `update` | Existing node updated (e.g., thumbnail) |
| `add_and_finish` | Node added, processing complete |
| `process_update` | Batch/process progress update |
| `process_finished` | Processing completed |

Auto-reconnect on error with 5-second delay.

**Verified from:** `src/components/GraphDisplay.vue` (`connectSSE`, `onmessage` handler)

## View Controls

Bottom-right controls in graph view:
- **Isolate/Show all:** Toggles between showing only the selected node's subgraph or the full graph
- **Hide/Show processes:** Toggles visibility of processing step nodes
- **Fullscreen icon:** Calls `flow.fitView()` to reset zoom/pan

**Verified from:** `src/components/GraphDisplay.vue` (template, view controls section)

## Layout Parameters

```js
dagreGraph.setGraph({ rankdir: direction, nodesep: 270, ranksep: 200 })
// All nodes use fixed dimensions: width=200, height=200
```

**Verified from:** `src/components/useLayout.js`

## Non-Obvious Behavior

- **`keep-alive` on GraphDisplay:** The `GraphDisplay` component is wrapped in `<keep-alive>` so it survives route changes between project sub-views (search, entities, file). When returning to graph view, the VueFlow state is preserved.
- **Batch refresh polling:** A 3-second `setInterval` polls running batch statuses to update progress banners.
- **Position persistence on drag:** Node positions are saved to the backend immediately on drag stop, so positions persist across sessions.
- **`useShuffle` composable:** Generates random edge arrangements—appears to be a development/demo utility, not used in production graph rendering.

**Verified from:** `src/components/GraphDisplay.vue`, `src/components/GraphMain.vue`, `src/components/useShuffle.js`
