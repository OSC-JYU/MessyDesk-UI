# State Management

## Store Design

Global state is a single `reactive({})` object in `src/components/Store.js`. It is imported directly by components as `import { store } from './Store.js'`. There are no computed getters, actions, or namespaced modules.

Batch processing state is managed separately in `src/stores/batchStore.js` — a dedicated reactive store for job progress, pause/resume/cancel actions, and SSE event handling.

**Verified from:** `src/components/Store.js`, `src/stores/batchStore.js`

## Store Shape

The store has the following key properties (grouped by concern):

### Session & Auth
| Property | Type | Purpose |
|----------|------|---------|
| `logged_out` | Boolean | Set to `true` when session expires (HTTP 302) |
| `user` | Object/null | Current user info |

### Graph & Project Context
| Property | Type | Purpose |
|----------|------|---------|
| `current_node` | Object | Currently selected graph node (set on click) |
| `current_project` | Object | Active project node |
| `root_nodes` | Array | Top-level project nodes |
| `projects` | Array | All user projects |
| `graph_node_update` | String | Trigger for graph re-render |
| `graph_style` | Array | (Currently unused in visible code) |

### File Viewing Context
| Property | Type | Purpose |
|----------|------|---------|
| `file` | Object/null | Currently opened file document |
| `file_count` | Number/null | Total files in current browse set |
| `skip` | Number/null | Current offset in browse set |
| `source` | String/null | Source set RID for browsing |
| `file_browse_context` | Object/null | Unified browse context (see below). Now a getter/setter onto `stores/fileBrowse.js` (`context`); `store.file` likewise maps to `fileBrowse.file` |
| `filter_editor` | Object/null | Active ROI filter node (enables ROI editing mode) |

### Dialog Visibility Flags
| Property | Purpose |
|----------|---------|
| `process_creator_open` | Cruncher creation dialog |
| `uploader_open` | File upload dialog |
| `set_uploader_open` | Upload to set dialog |
| `node_deleter_open` | Node deletion confirmation |
| `project_deleter_open` | Project deletion confirmation |
| `crunchers_open` | Cruncher list dialog |
| `set_creator_open` | Set creation dialog |
| `source_creator_open` | Source creation dialog |
| `search_open` | Search overlay |

### Settings (UI preferences)
| Property | Default | Purpose |
|----------|---------|---------|
| `settings_show_descriptions` | `true` | Show node descriptions |
| `settings_show_entities` | `true` | Show entity chips |
| `settings_text_markdown` | `false` | Render text as markdown |

### Per-Page State Caches
| Property | Purpose |
|----------|---------|
| `set_panel_cache` | Snapshot of set panel state for restore on navigation back |

### Process Tracking
| Property | Purpose |
|----------|---------|
| `running_processes` | Object keyed by process RID, tracks running batch jobs |

**Verified from:** `src/components/Store.js`

Search and Tags remember their state per scope (a desk rid or `global`) in `stores/pageMemory.js` (`recall`/`remember`), for the browser session; the old `search_page_states`/`entities_page_states` fields are gone.

## `file_browse_context` Shape

This object encodes how the user arrived at the current file view:

```js
// Set browsing mode
{
  mode: 'set',
  set_rid: '#xx:yy',
  set_label: 'My Set',
  file_count: 42,
  skip: 3,
  source_rid: '#aa:bb',   // null if browsing entire set
  source_label: 'Source name'
}

// Search results mode
{
  mode: 'search',
  query: 'search term',
  results: [{ rid, label, score, highlight }],
  index: 2
}

// Direct open (no context)
null
```

**Verified from:** `src/components/Store.js` (comments), `src/components/displays/FileDisplayWrapper.vue`

## Invariants

1. **Only one file viewed at a time:** `store.file` is always a single document object or `null`.
2. **`current_node` is the last-clicked graph node:** Set by `onNodeClick` and `onNodeDoubleClick` in `GraphDisplay.vue`. Reset to `null` on pane click.
3. **Dialog flags are mutually non-exclusive:** Multiple dialogs can technically be open simultaneously (no guard logic prevents it), though the UI typically shows one at a time.
4. **`update` counter triggers reloads:** `store.reload()` increments `store.update`, which watchers in `GraphDisplay` observe to reload graph data.

**Verified from:** `src/components/GraphDisplay.vue`, `src/components/Store.js`

## Non-Obvious Behavior

- **No persistence:** The store is entirely in-memory. Page refresh loses all state (selected nodes, open panels, search results). The `set_panel_cache` and page state caches only survive within a single browser session.
- **Unreachable code in `current()`:** The `Store.js` `current()` method has a `return` statement after the if/else block that can never execute.
- **`source_creator_type` is set before opening dialog:** The pattern for the source creator is to set `store.source_creator_type` then set `store.source_creator_open = true`, relying on the dialog reading the type on mount.

**Verified from:** `src/components/Store.js`, `src/components/ProjectDrawer.vue`
