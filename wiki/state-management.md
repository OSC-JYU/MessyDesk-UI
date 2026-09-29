# State Management

There is no global store any more. State lives in small reactive modules and, for a desk, in a
workspace shared by provide/inject.

| Where | Holds |
| --- | --- |
| `stores/session.js` | Signed-in user (`loadUser()`, `isAdmin`), expired-session flag |
| `stores/ui.js` | Header/drawer state: `drawerOpen`, `projectLabel` |
| `stores/fileBrowse.js` | The open file, its browse context (set or result list), the ROI set being edited, the Markdown preference |
| `stores/pageMemory.js` | Per-screen, per-scope memory for the browser session (Search, Tags, set browser page) |
| `stores/batchStore.js` | Batch jobs from SSE events, with pause/resume/cancel/dismiss |
| `features/project/useWorkspace.js` | One desk: selected node, reload/fit requests, dialog state |

## Browse context

`fileBrowse.context` is `null` (a file on its own) or:

```
{ mode: 'set', set_rid, set_label, file_count, skip, source_rid, source_label }   // skip is 0-based
{ mode: 'search', query, results: [{ rid, label, score, highlight }], index }
```

Set mode is also written to the file viewer's URL (`browseMode=set&…`); see
[file-display-system.md](file-display-system.md).

**Verified from:** `src/stores/`, `src/features/project/useWorkspace.js`
