# API Layer (`web.js`)

## Design

All HTTP communication is centralized in `src/web.js`, which exports a single `web` object with async methods. Axios is configured once with:

- `baseURL` from `VITE_API_PATH`
- A global response interceptor that normalizes errors into `{ status, message }` shape

**Verified from:** `src/web.js`

## Error Handling Pattern

The interceptor transforms Axios errors into three categories:

| Condition | Resulting `status` | Resulting `message` |
|-----------|-------------------|---------------------|
| Server responded (4xx/5xx) | `error.response.status` | `error.response.data.message` or `'Server error occurred'` |
| No response (network) | `0` | `'Network error - no response received'` |
| Request config error | `0` | `'Request configuration error'` |

Components consuming `web.*` functions receive rejected promises with `{ status, message }` objects (not Axios error objects).

**Verified from:** `src/web.js` (interceptor)

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
| `getEntitySchema()` | GET | `/api/entities/types` |
| `getSetEntities(setRid)` | GET | `/api/entities/sets/:rid` |
| `getEntityItems(entities, options)` | GET | `/api/entities/items` |
| `getEntitiesByType(type)` | GET | `/api/entities/types/:type` |
| `createEntity(type, label)` | POST | `/api/entities` |
| `linkEntityToItem(entityRID, itemRid)` | POST | `/api/entities/:eid/vertex/:vid` |
| `unLinkEntity(entityRID, itemRid)` | DELETE | `/api/entities/:eid/vertex/:vid` |
| `getTags()` | GET | `/api/tags` |
| `createTag(label)` | POST | `/api/tags` |
| `getMachineTags()` | GET | `/api/tags/machine` |
| `getMachineTagFiles(entityRID, serviceId, task)` | GET | `/api/tags/machine/:eid/files` |
| `getNerRegions(fileRID)` | GET | `/api/files/:rid/ner` |

`getTags`/`createTag` operate on manual Tag entities (backed by `TagLink` rows with `created_by: 'user'`).
`getMachineTags`/`getMachineTagFiles` browse machine-generated tags (`created_by: 'machine'`), grouped by
the service/task that produced them — used by `TagsMain.vue`. Per-mention detail (start/end/confidence) for
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

**Verified from:** `src/web.js` (every method using rid parameters)

## Fallback Behavior

`web.search()` and `web.getEntityItems()` implement a fallback: if the backend returns an error when project filter parameters are provided, they retry without the project filter and set a `_project_filter_ignored = true` flag on the result.

**Inferred purpose:** Allows the UI to gracefully degrade when the backend doesn't support project-scoped filtering.

**Verified from:** `src/web.js` (`search`, `getEntityItems` methods)
