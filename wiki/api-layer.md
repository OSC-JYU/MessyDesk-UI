# API Layer (`src/api/`)

## Design

All HTTP communication goes through `src/api/client.js`, which exports a single `web` object with async methods. Code does not import it directly: it calls the area modules in `src/api/` (`projects`, `files`, `services`, `search`, `entities`, `admin`, `session`), which wrap it. Axios is configured once with:

- `baseURL` from `VITE_API_PATH`
- A global response interceptor that normalizes errors into `{ status, message }` shape and reports 401/302 responses to the handler set with `onAuthError()` (see [authentication.md](authentication.md))

**Verified from:** `src/api/client.js`

## Error Handling Pattern

The interceptor transforms Axios errors into three categories:

| Condition | Resulting `status` | Resulting `message` |
|-----------|-------------------|---------------------|
| Server responded (4xx/5xx) | `error.response.status` | `error.response.data.message` or `'Server error occurred'` |
| No response (network) | `0` | `'Network error - no response received'` |
| Request config error | `0` | `'Request configuration error'` |

Components calling `api/` functions receive rejected promises with `{ status, message }` objects (not Axios error objects).

**Verified from:** `src/api/client.js` (interceptor)

## API Method Categories

### Authentication & Session
| Method | Verb | Endpoint | Returns |
|--------|------|----------|---------|
| `sso()` | GET | `/api/sso` | Full response (SSO user info) |
| `ready()` | GET | `/api` | Full response (session check) |
| `getMe()` | GET | `/api/me` | `data` (current user) |

### Projects
| Method | Verb | Endpoint | Returns |
|--------|------|----------|---------|
| `getProjects()` | GET | `/api/projects` | `data` (project list) |
| `getProject(rid)` | GET | `/api/projects/:rid` | `data` |
| `createProject(name, desc, x, y)` | POST | `/api/projects` | `data` |
| `deleteProject(rid)` | DELETE | `/api/projects/:rid` | full response |
| `setProjectAttribute(rid, data)` | PUT | `/api/projects/:rid` | `data` |
| `updateProjectSizes()` | POST | `/api/projects/update-size` | `data` |
| `getStorageSummary()` | GET | `/api/projects/storage-summary` | `data` |
| `reindexProjectSearch(rid)` | POST | `/api/projects/:rid/reindex-search` | `data` |

### Sets
| Method | Verb | Endpoint |
|--------|------|----------|
| `createSet(project_rid, name, desc)` | POST | `/api/projects/:rid/sets` |
| `getSetFiles(rid, skip, limit, options)` | GET | `/api/sets/:rid/files` |
| `createSetThumbnails(rid, options)` | POST | `/api/sets/:rid/thumbnails` |
| `createSetZipJob(set_rid)` | POST | `/api/sets/:rid/files/zip/jobs` |
| `getSetZipJobStatus(set_rid, job_id)` | GET | `/api/sets/:rid/files/zip/jobs/:id` |

### Files
| Method | Verb | Endpoint |
|--------|------|----------|
| `getNodeFile(rid)` | GET | `/api/files/:rid` |
| `getNodeFileBlob(rid)` | GET | `/api/files/:rid` (blob) |
| `getDocInfo(rid)` | GET | `/api/documents/:rid` |
| `createFileVersion(rid, payload)` | POST | `/api/files/:rid/version` |
| `revertFileVersion(rid)` | POST | `/api/files/:rid/revert` |
| `createFileThumbnail(rid)` | POST | `/api/files/:rid/thumbnail` |
| `getFileAncestors(rid)` | GET | `/api/files/:rid/ancestors` |

### Processing (Crunchers / Queue)
| Method | Verb | Endpoint |
|--------|------|----------|
| `getServices()` | GET | `/api/services` |
| `getServicesForFile(file_rid, filter)` | GET | `/api/services/files/:rid` |
| `getInitData(service_id)` | GET | `/api/services/:id/init` |
| `createFileProcess(process, file_rid)` | POST | `/api/queue/:service/files/:rid` |
| `createROIProcess(process, file_rid)` | POST | `/api/queue/:service/files/:rid/roi` |
| `createSetProcess(process, set_rid)` | POST | `/api/queue/:service/sets/:rid` |
| `createSourceProcess(process, set_rid)` | POST | `/api/queue/:service/sources/:rid` |
| `cancelProcess(process_rid)` | GET | `/api/queue/drain/:rid` |
| `getBatch(rid)` | GET | `/api/batches/:rid` |
| `pauseBatch(rid)` | POST | `/api/batches/:rid/pause` |
| `resumeBatch(rid)` | POST | `/api/batches/:rid/resume` |
| `cancelBatch(rid)` | POST | `/api/batches/:rid/cancel` |
| `getQueue(service_id)` | GET | `/api/queue/:id/status` |

### Graph Operations
| Method | Verb | Endpoint |
|--------|------|----------|
| `getGraph(query, current, cluster)` | POST | `/api/graph/query` |
| `getMyGraph(rel_types, node_types, q_return)` | POST | `/api/graph/query/me` |
| `getNodePath(rid)` | GET | `/api/graph/traverse/:rid/out` |
| `getSchemaAndData(rid)` | GET | `/api/graph/vertices/:rid` |
| `createNode(data)` | POST | `/api/graph/vertices` |
| `deleteNode(rid)` | DELETE | `/api/graph/vertices/:rid` |
| `setNodeAttribute(rid, data)` | POST | `/api/graph/vertices/:rid` |
| `setRelationAttribute(rid, data)` | POST | `/api/graph/edges/:rid` |
| `getStats()` | GET | `/api/graph/stats` |

### Entities (Tags)
| Method | Verb | Endpoint |
|--------|------|----------|
| `getEntities()` | GET | `/api/entities` |
| `getEntityTypes({ counts })` | GET | `/api/entities/types` (`?counts=1` adds `count` and `protected`) |
| `createEntityType(type, color)` | POST | `/api/entities/types` |
| `deleteEntityType(type)` | DELETE | `/api/entities/types/:type` (name URL-encoded) |
| `getSetEntities(setRid)` | GET | `/api/entities/sets/:rid` |
| `getEntityItems(entities, options)` | GET | `/api/entities/items` (`options.match: 'and'` for files with all the tags; default any; `options.skip` / `options.limit` for a page). Returns `{ total, skip, limit, items }` |
| `getEntitiesByType(type)` | GET | `/api/entities/types/:type` |
| `createEntity(type, label, projectRid)` | POST | `/api/entities` (`project_rid` required) |
| `linkEntityToItem(entityRID, itemRid)` | POST | `/api/entities/:eid/vertex/:vid` |
| `unLinkEntity(entityRID, itemRid)` | DELETE | `/api/entities/:eid/vertex/:vid` |
| `getTags({ projectRid })` | GET | `/api/tags` (the desk's Tag entities; all without a desk) |
| `createTag(label, description, projectRid)` | POST | `/api/tags` (`project_rid` required) |
| `getTagAdmin({ projectRid, search, skip, limit })` | GET | `/api/tags/admin` |
| `getEntityUsage(entityRID)` | GET | `/api/entities/:eid/usage` |
| `renameEntity(entityRID, label, description)` | PATCH | `/api/entities/:eid` |
| `deleteEntity(entityRID)` | DELETE | `/api/entities/:eid` (delete everywhere) |
| `createDeskTag(projectRid, { type, label, description })` | POST | `/api/projects/:rid/tags` |
| `importDeskTags(projectRid, { entity_rids } or { from_project_rid })` | POST | `/api/projects/:rid/tags/import` |
| `removeDeskTag(projectRid, entityRID)` | DELETE | `/api/projects/:rid/tags/:eid` |
| `getRoiLabels({ projectRids, search, offset, limit })` | GET | `/api/tags/roi/labels` |
| `getMachineTags({ projectRids })` | GET | `/api/tags/machine` |
| `getMachineTagFiles(entityRID, serviceId, task)` | GET | `/api/tags/machine/:eid/files` |
| `getNerRegions(fileRID)` | GET | `/api/files/:rid/ner` |

Tag types are per user, shared by all their desks. `getEntityTypes({ counts: true })` adds `count` (tags of the
type in all desks, human and machine) and `protected` (true only for `Tag`, which autotag uses and which can
never be deleted). `createEntityType` rejects with 400 (invalid name) or 409 (name exists, case-insensitive);
`deleteEntityType` rejects with 409 while the type has tags and 400 for `Tag`. `createEntity`/`createTag` answer
400 for a missing or unknown type.

`getTags`/`createTag` operate on manual Tag entities (backed by `TagLink` rows with `created_by: 'user'`).
Human tags belong to desks (backend `DeskTag`): creating needs a `projectRid`, `getTags`/`getEntities`/
`getEntitiesByType` with a desk list that desk's tags (also unused ones), and `getEntitiesByType` items of human
tags carry `desks: [{ rid, label }]`. The admin calls (`getTagAdmin` … `removeDeskTag`) work on human tags only
(machine tags answer 400). `renameEntity` renames in every desk that has the tag and rejects with
`{ status: 409, message }` when one already has that label. `getRoiLabels` lists labels of indexed `ner.json`
runs (`{ items: [{ service_id, task, model, label, count, service_name }], hasMore }`; `model` is `''` for none)
and fails when the search index is down. The tag filter (`createFilter('mdf-set-filter', …)`) accepts
`selected_roi_labels` next to `selected_entity_rids`.
`getMachineTags`/`getMachineTagFiles` browse machine-generated tags (`created_by: 'machine'`), grouped by
the service/task/model that produced them (limited to the Tags page's desks) — used by `TagsPage.vue`,
labelled by `tagGroups.js` `runLabel` as "service: task" or, for runs with a model,
"model (provider name): task". Per-mention detail (start/end/confidence) for
a machine tag is not stored per-region; `getNerRegions` reads the source `ner.json` file node directly and
the UI filters its regions by label client-side.

### Search
| Method | Verb | Endpoint |
|--------|------|----------|
| `search(query, options)` | POST | `/api/search` |
| `getSearchInfo()` | GET | `/api/search/info` |

### ROI (Region of Interest)
| Method | Verb | Endpoint |
|--------|------|----------|
| `saveImageROIs(rid, set_rid, rois)` | POST | `/api/images/:rid/sets/:set_rid/rois` |
| `getImageROIs(rid, set_rid)` | GET | `/api/images/:rid/sets/:set_rid/rois` |
| `updateImageROI(rid, set_rid, roi_rid, rois)` | PUT | `/api/images/:rid/sets/:set_rid/rois/:roi_rid` |
| `createROIs(rid, data, width, height)` | POST | `/api/graph/vertices/:rid/rois` |

### Filters
| Method | Verb | Endpoint |
|--------|------|----------|
| `createFilter(filter_id, file_rid, payload)` | POST | `/api/filters/:id/files/:rid` |

### Admin & Permissions
| Method | Verb | Endpoint |
|--------|------|----------|
| `getUsers()` | GET | `/api/users` |
| `createUser(data)` | POST | `/api/users` |
| `addPermissionRequest()` | POST | `/api/permissions/request` |
| `getPermissionRequests()` | GET | `/api/permissions/request` |
| `removePermissionRequest(rid)` | DELETE | `/api/permissions/request/:rid` |

## RID Handling Convention

All methods that accept a graph RID (OrientDB-style `#cluster:position`) strip the `#` prefix before embedding it in URLs using `.replace('#','')`. This is applied consistently across all methods.

**Verified from:** `src/api/client.js` (every method using rid parameters)

## Fallback Behavior

`web.search()` and `web.getEntityItems()` implement a fallback: if the backend returns an error when project filter parameters are provided, they retry without the project filter and set a `_project_filter_ignored = true` flag on the result.

**Inferred purpose:** Allows the UI to gracefully degrade when the backend doesn't support project-scoped filtering.

**Verified from:** `src/api/client.js` (`search`, `getEntityItems` methods)
