import axios from 'axios'

// Shared by entity/tag lookups that can be scoped to one or more projects (options.projectRid /
// options.projectRids), so Tag view only surfaces tags/NER data used within the current project.
function projectParams(options = {}) {
  const projectRids = Array.isArray(options.projectRids)
    ? options.projectRids.filter(Boolean)
    : options.projectRid
      ? [options.projectRid]
      : []
  const params = {}
  if (projectRids.length === 1) params.project_rid = String(projectRids[0]).replace('#', '')
  if (projectRids.length > 1)
    params.project_rids = projectRids.map((r) => String(r).replace('#', '')).join(',')
  return params
}

function entityListParams(options = {}) {
  const params = projectParams(options)
  if (options.createdBy) params.created_by = options.createdBy
  const search = String(options.search || '').trim()
  if (search) params.search = search
  return params
}

// Narrows NER label/mention lookups to a given set of file rids (options.fileRids), used to
// intersect NER browsing with an active manual-tag selection in Tag view.
function fileRidsParams(options = {}) {
  const fileRids = Array.isArray(options.fileRids) ? options.fileRids.filter(Boolean) : []
  return fileRids.length
    ? { file_rids: fileRids.map((r) => String(r).replace('#', '')).join(',') }
    : {}
}
let web = {}

axios.defaults.baseURL = import.meta.env.VITE_API_PATH

// Called with the HTTP status when the backend refuses a request because of
// the session: 401 (no MessyDesk account for this user) or 302 (the sign-in
// proxy wants to redirect, i.e. the session has expired). Set by the app.
let authErrorHandler = null
export function onAuthError(handler) {
  authErrorHandler = handler
}

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    if (authErrorHandler && (status === 401 || status === 302)) authErrorHandler(status)
    if (error.response) {
      // Server responded with error status (4xx, 5xx)
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data,
      })
      return Promise.reject({
        status: error.response.status,
        message: error.response.data?.message || 'Server error occurred',
      })
    } else if (error.request) {
      // Request made but no response received
      console.error('Network Error:', error.request)
      return Promise.reject({
        status: 0,
        message: 'Network error - no response received',
      })
    } else {
      // Error in request configuration
      console.error('Request Error:', error.message)
      return Promise.reject({
        status: 0,
        message: 'Request configuration error',
      })
    }
  },
)

web.sso = async function () {
  var response = await axios.get('/api/sso')
  return response
}

web.ready = async function () {
  var response = await axios.get('/api')
  return response
}

web.getError = async function (rid) {
  var result = await axios.get(`/api/errors/${rid}`)
  return result.data
}

web.search = async function (search, options = {}) {
  const payload = { query: search }
  const requestedRows = Number(options.rows)
  if (Number.isFinite(requestedRows) && requestedRows > 0)
    payload.rows = Math.min(1000, Math.floor(requestedRows))
  const projectRids = Array.isArray(options.projectRids)
    ? options.projectRids.filter(Boolean)
    : options.projectRid
      ? [options.projectRid]
      : []
  if (projectRids.length === 1) payload.project_rid = String(projectRids[0]).replace('#', '')
  if (projectRids.length > 1)
    payload.project_rids = projectRids.map((r) => String(r).replace('#', ''))
  try {
    var result = await axios.post(`/api/search`, payload)
    return result.data
  } catch (error) {
    // Backend project-filter endpoint may not be available yet; fall back to global search.
    if (projectRids.length > 0) {
      var fallback = await axios.post(`/api/search`, { query: search })
      const data = fallback.data || {}
      data._project_filter_ignored = true
      return data
    }
    throw error
  }
}

web.savePrompt = async function (prompt) {
  var result = await axios.post(`/api/prompts`, prompt)
  return result.data
}

web.getQueue = async function (service_id) {
  var result = await axios.get(`/api/queue/${service_id}/status`)
  return result.data
}

web.rawQuery = async function (query) {
  var result = await axios.post(`/api/query`, { query: query })
  return result.data
}

web.getGraph = async function (query, current_node, cluster) {
  var result = await axios.post('/api/graph/query', {
    query: query,
    current: current_node,
    cluster: cluster,
  })
  return result
}
// Add response interceptor to handle errors globally

web.createProject = async function (name, description, x, y) {
  var data = {
    label: name,
    description: description,
    position: { x: x, y: y },
  }
  var response = await axios.post('/api/projects', data)
  return response.data
}

web.createSet = async function (project_rid, name, description) {
  project_rid = project_rid.replace('#', '')
  var data = {
    label: name,
    description: description,
  }
  var response = await axios.post(`/api/projects/${project_rid}/sets`, data)
  return response.data
}

web.createSource = async function (project_rid, state, type) {
  project_rid = project_rid.replace('#', '')
  var data = {
    type: type,
    label: state.source_name,
    url: state.url,
    description: state.description,
  }

  var response = await axios.post(`/api/projects/${project_rid}/sources`, data)
  return response.data
}

web.getServices = async function () {
  var result = await axios.get(`/api/services`)
  return result.data
}

// --- Service control ---

web.getQueueStatus = async function (topic) {
  var result = await axios.get(`/api/queue/${encodeURIComponent(topic)}/status`)
  return result.data
}

web.getActiveJobs = async function () {
  var result = await axios.get(`/api/queue/jobs/active`)
  return result.data
}

web.flushQueue = async function (topic) {
  var result = await axios.get(`/api/queue/${encodeURIComponent(topic)}/flush`)
  return result.data
}

web.cancelJob = async function (rid) {
  var result = await axios.post(`/api/batches/${encodeURIComponent(rid)}/cancel`)
  return result.data
}

web.startService = async function (serviceId, nomad_hcl) {
  var payload = nomad_hcl ? { nomad_hcl } : {}
  var result = await axios.post(`/api/nomad/service/${encodeURIComponent(serviceId)}`, payload)
  return result.data
}

web.stopService = async function (serviceId) {
  var result = await axios.delete(`/api/nomad/service/${encodeURIComponent(serviceId)}`)
  return result.data
}

web.installService = async function (payload) {
  var result = await axios.post(`/api/services/install`, payload)
  return result.data
}

web.forgetService = async function (serviceId) {
  var result = await axios.delete(`/api/services/${encodeURIComponent(serviceId)}`)
  return result.data
}

web.reloadServices = async function () {
  var result = await axios.post(`/api/services/reload`, {})
  return result.data
}

web.getPrompts = async function () {
  var result = await axios.get(`/api/prompts`)
  return result.data
}

web.getHelp = async function (slug = 'index') {
  const normalizedSlug = String(slug || 'index')
    .trim()
    .toLowerCase()
  const url =
    normalizedSlug && normalizedSlug !== 'index'
      ? `/api/help/${encodeURIComponent(normalizedSlug)}`
      : '/api/help'
  const result = await axios.get(url, { responseType: 'text' })
  return result.data
}

web.getServiceHelp = async function (serviceId) {
  const normalizedServiceId = String(serviceId || '').trim()
  if (!normalizedServiceId) throw { status: 400, message: 'Missing service id' }
  const url = `/api/services/${encodeURIComponent(normalizedServiceId)}/help`
  const result = await axios.get(url, { responseType: 'text' })
  return result.data
}

web.getServiceHelpAsset = async function (serviceId, assetPath) {
  const normalizedServiceId = String(serviceId || '').trim()
  const normalizedAssetPath = String(assetPath || '')
    .trim()
    .replace(/^\/+/, '')
  if (!normalizedServiceId) throw { status: 400, message: 'Missing service id' }
  if (!normalizedAssetPath) throw { status: 400, message: 'Missing service help asset path' }
  const url = `/api/services/${encodeURIComponent(normalizedServiceId)}/help/assets/${normalizedAssetPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')}`
  const result = await axios.get(url, { responseType: 'text' })
  return result.data
}

web.getUsers = async function () {
  var result = await axios.get(`/api/users`)
  return result.data
}

web.addPermissionRequest = async function () {
  var result = await axios.post(`/api/permissions/request`, {})
  return result.data
}

web.getPermissionRequests = async function () {
  var result = await axios.get(`/api/permissions/request`)
  return result.data
}

web.removePermissionRequest = async function (rid) {
  var result = await axios.delete(`/api/permissions/request/${rid.replace('#', '')}`)
  return result.data
}

web.createUser = async function (data) {
  try {
    var result = await axios.post(`/api/users`, data)
    return result.data
  } catch (error) {
    if (error.response) return error.response.data
    else return error
  }
}

web.updateUserServiceGroups = async function (rid, service_groups) {
  var result = await axios.put(`/api/users/${rid.replace('#', '')}/service-groups`, {
    service_groups,
  })
  return result.data
}

web.getServiceGroups = async function () {
  var result = await axios.get(`/api/service-groups`)
  return result.data
}

web.createServiceGroup = async function (data) {
  var result = await axios.post(`/api/service-groups`, data)
  return result.data
}

web.updateServiceGroup = async function (id, data) {
  var result = await axios.put(`/api/service-groups/${encodeURIComponent(id)}`, data)
  return result.data
}

web.deleteServiceGroup = async function (id) {
  var result = await axios.delete(`/api/service-groups/${encodeURIComponent(id)}`)
  return result.data
}

web.uploadServiceGroupLogo = async function (id, fileObject) {
  var formData = new FormData()
  formData.append('file', fileObject)
  var result = await axios.post(`/api/service-groups/${encodeURIComponent(id)}/logo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return result.data
}

web.getServicesForFile = async function (file_rid, filter) {
  var filter_query = ''
  if (filter) filter_query = '?filter=' + filter
  var result = await axios.get(`/api/services/files/${file_rid.replace('#', '')}${filter_query}`)
  return result.data
}

web.createFilter = async function (filter_id, file_rid, payload = {}) {
  const url = `/api/filters/${filter_id}/files/${file_rid.replace('#', '')}`
  var result = await axios.post(url, payload)
  return result.data
}

web.getInitData = async function (service_id) {
  var result = await axios.get(`/api/services/${service_id}/init`)
  return result.data
}

web.getProcessParams = async function (process_path) {
  var result = await axios.get(process_path)
  return result
}

web.getMe = async function () {
  var result = await axios.get(`/api/me`)
  return result.data
}

web.saveSettings = async function (settings) {
  var result = await axios.put(`/api/me/settings`, settings)
  return result.data
}

web.getSchemas = async function () {
  var result = await axios.get(`/api/schemas`)
  return result.data.result
}

web.getQueries = async function () {
  var result = await axios.get(`/api/queries`)
  return result.data.result
}

web.getGroups = async function () {
  var result = await axios.get(`/api/groups`)
  return result.data
}

web.getProjects = async function () {
  var result = await axios.get(`/api/projects`)
  return result.data
}

web.updateProjectSizes = async function () {
  var result = await axios.post(`/api/projects/update-size`)
  return result.data
}

web.getStorageSummary = async function () {
  var result = await axios.get(`/api/projects/storage-summary`)
  return result.data
}

web.getProject = async function (rid) {
  var result = await axios.get(`/api/projects/${rid.replace('#', '')}`)
  return result.data
}

web.reindexProjectSearch = async function (rid) {
  var result = await axios.post(`/api/projects/${rid.replace('#', '')}/reindex-search`)
  return result.data
}

// Semantic search: the user's vector and similarity indexes, starting a search (answers at once with its id)
// and polling it until it is done.
web.getSemanticIndexes = async function () {
  var result = await axios.get(`/api/search/semantic/indexes`)
  return result.data
}

web.startSemanticSearch = async function ({ index, query, k, level, threshold }) {
  var result = await axios.post(`/api/search/semantic`, { index, query, k, level, threshold })
  return result.data
}

web.getSemanticSearch = async function (id) {
  var result = await axios.get(`/api/search/semantic/${encodeURIComponent(id)}`)
  return result.data
}

web.getSearchInfo = async function () {
  var result = await axios.get(`/api/search/info`)
  return result.data
}

web.getSetFiles = async function (rid, skip, limit, options = {}) {
  const params = new URLSearchParams()
  if (skip !== undefined && skip !== null) params.set('skip', String(skip))
  if (limit !== undefined && limit !== null) params.set('limit', String(limit))
  if (options.groupByOrigin) params.set('group_by_origin', 'true')
  if (options.sourceRid) params.set('source_rid', String(options.sourceRid).replace('#', ''))

  const query = params.toString() ? `?${params.toString()}` : ''
  var result = await axios.get(`/api/sets/${rid.replace('#', '')}/files${query}`)
  return result.data
}

web.getFiles = async function (dir) {
  var result = await axios.get(`/api/files/` + dir)
  return result.data
}

// Tag types with how many tags each has: [{ type, count, icon, color }]. Options: desks
// (projectRid/projectRids), createdBy ('user' | 'machine') and a label search.
web.getEntities = async function (options = {}) {
  var result = await axios.get(`/api/entities`, { params: entityListParams(options) })
  return result.data
}

// One page of a type's tags, sorted by label: { type, total, skip, limit, items }.
web.getEntitiesByType = async function (type, options = {}) {
  var params = { ...entityListParams(options), skip: options.skip || 0, limit: options.limit || 200 }
  var result = await axios.get(`/api/entities/by-type/${encodeURIComponent(type)}`, { params })
  return result.data
}

web.getEntitySchema = async function () {
  var result = await axios.get(`/api/entities/types`)
  return result.data
}

web.getSetEntities = async function (setRid) {
  var result = await axios.get(`/api/entities/sets/${String(setRid).replace('#', '')}`)
  return result.data
}

web.getEntityItems = async function (entities, options = {}) {
  var entity_rids = entities.map((e) => e['@rid'].replace('#', ''))
  const projectRids = Array.isArray(options.projectRids)
    ? options.projectRids.filter(Boolean)
    : options.projectRid
      ? [options.projectRid]
      : []
  const params = new URLSearchParams()
  params.set('entities', entity_rids.join(','))
  if (projectRids.length === 1) params.set('project_rid', String(projectRids[0]).replace('#', ''))
  if (projectRids.length > 1)
    params.set('project_rids', projectRids.map((r) => String(r).replace('#', '')).join(','))
  const query = params.toString()
  try {
    var result = await axios.get(`/api/entities/items?${query}`)
    return result.data
  } catch (error) {
    if (projectRids.length > 0) {
      var fallback = await axios.get(`/api/entities/items?entities=${entity_rids.join(',')}`)
      const data = fallback.data || []
      if (Array.isArray(data)) data._project_filter_ignored = true
      return data
    }
    throw error
  }
}

web.createEntity = async function (type, label) {
  var result = await axios.post(`/api/entities`, { type: type, label: label })
  return result.data
}

web.linkEntityToItem = async function (entityRID, itemRId) {
  var result = await axios.post(
    `/api/entities/${entityRID.replace('#', '')}/vertex/${itemRId.replace('#', '')}`,
  )
  return result.data
}

web.unLinkEntity = async function (entityRID, itemRId) {
  var result = await axios.delete(
    `/api/entities/${entityRID.replace('#', '')}/vertex/${itemRId.replace('#', '')}`,
  )
  return result.data
}

web.getTags = async function () {
  var result = await axios.get(`/api/tags`)
  return result.data
}

web.createTag = async function (label, description) {
  var result = await axios.post(`/api/tags`, { label: label, description: description })
  return result.data
}

web.getMachineTags = async function () {
  var result = await axios.get(`/api/tags/machine`)
  return result.data
}

web.getMachineTagFiles = async function (entityRID, serviceId, task) {
  var result = await axios.get(`/api/tags/machine/${entityRID.replace('#', '')}/files`, {
    params: { service_id: serviceId, task: task },
  })
  return result.data
}

web.getMachineTagMentions = async function (entityRID, serviceId, task, options = {}) {
  var result = await axios.get(`/api/tags/machine/${entityRID.replace('#', '')}/mentions`, {
    params: {
      service_id: serviceId,
      task: task,
      search: options.search,
      page: options.page,
      pageSize: options.pageSize,
    },
  })
  return result.data
}

web.getNerRegions = async function (fileRID) {
  var result = await axios.get(`/api/files/${fileRID.replace('#', '')}/ner`)
  return result.data
}

// NER never creates tags (see MessyDesk's tags.md section 1): labels/files/mentions are read
// straight off ner.json runs, not TagLink, so these have no entity rid to key on.
web.getNerLabelGroups = async function (search, options = {}) {
  var result = await axios.get(`/api/tags/ner/labels`, {
    params: { search, ...projectParams(options), ...fileRidsParams(options) },
  })
  return result.data
}

web.getNerLabelFiles = async function (serviceId, task, label, options = {}) {
  var result = await axios.get(`/api/tags/ner/labels/files`, {
    params: {
      service_id: serviceId,
      task: task,
      label: label,
      ...projectParams(options),
      ...fileRidsParams(options),
    },
  })
  return result.data
}

web.getNerLabelMentions = async function (serviceId, task, label, options = {}) {
  var result = await axios.get(`/api/tags/ner/labels/mentions`, {
    params: {
      service_id: serviceId,
      task: task,
      label: label,
      search: options.search,
      page: options.page,
      pageSize: options.pageSize,
      ...projectParams(options),
      ...fileRidsParams(options),
    },
  })
  return result.data
}

web.getStats = async function () {
  var result = await axios.get(`/api/graph/stats`)
  return result.data
}

web.importFile = async function (dir, filename, mode) {
  if (mode) filename = filename + '&mode=' + mode
  var result = await axios.post(`/api/` + dir + '/import?filename=' + filename)
  return result
}

web.getDocInfo = async function (rid) {
  var result = await axios.get(`/api/documents/${rid.replace('#', '')}`)
  console.log('docinfo')
  console.log(result.data)
  return result.data
}

web.getNodeFile = async function (rid) {
  var result = await axios.get(`/api/files/${rid.replace('#', '')}`)
  return result.data
}

web.getNodeFileBlob = async function (rid) {
  var result = await axios.get(`/api/files/${rid.replace('#', '')}`, { responseType: 'blob' })
  return result.data
}

web.createFileVersion = async function (rid, payload = {}) {
  const cleanRid = rid.replace('#', '')
  if (payload?.file instanceof Blob) {
    const formData = new FormData()
    formData.append('file', payload.file, payload.filename || 'edited.bin')
    if (payload.operation) formData.append('operation', payload.operation)
    if (payload.params) formData.append('params', JSON.stringify(payload.params))
    const result = await axios.post(`/api/files/${cleanRid}/version`, formData)
    return result.data
  }
  const result = await axios.post(`/api/files/${cleanRid}/version`, payload)
  return result.data
}

web.revertFileVersion = async function (rid) {
  const result = await axios.post(`/api/files/${rid.replace('#', '')}/revert`)
  return result.data
}

web.createFileThumbnail = async function (rid) {
  const result = await axios.post(`/api/files/${rid.replace('#', '')}/thumbnail`)
  return result.data
}

web.createSetThumbnails = async function (rid, options = {}) {
  const params = new URLSearchParams()
  if (options.limit !== undefined && options.limit !== null)
    params.set('limit', String(options.limit))
  const query = params.toString() ? `?${params.toString()}` : ''
  const result = await axios.post(`/api/sets/${rid.replace('#', '')}/thumbnails${query}`)
  return result.data
}

web.getNodePath = async function (rid) {
  var result = await axios.get(`/api/graph/traverse/${rid.replace('#', '')}/out`)
  return result.data
}

web.getFileAncestors = async function (rid) {
  var result = await axios.get(`/api/files/${rid.replace('#', '')}/ancestors`)
  return result.data
}

web.getSchemaAndData = async function (rid) {
  var result = await axios.get(`/api/graph/vertices/${rid.replace('#', '')}`)
  return result.data
}

web.getMyGraph = async function (rel_types = [], node_types = [], q_return = '') {
  if (!Array.isArray(rel_types)) rel_types = [rel_types]
  if (!Array.isArray(node_types)) node_types = [node_types]
  var result = await axios.post('/api/graph/query/me', {
    rel_types: rel_types,
    node_types: node_types,
    return: q_return,
  })
  return result
}

web.createFileProcess = async function (process, file_rid) {
  const url = `/api/queue/${process.service}/files/${file_rid.replace('#', '')}`
  console.log(url)
  var result = await axios.post(url, process)
  return result
}

web.createROIProcess = async function (process, file_rid) {
  const url = `/api/queue/${process.service}/files/${file_rid.replace('#', '')}/roi`
  console.log(url)
  var result = await axios.post(url, process)
  return result
}

web.createSetProcess = async function (process, set_rid) {
  const url = `/api/queue/${process.service}/sets/${set_rid.replace('#', '')}`
  var result = await axios.post(url, process)
  return result
}

web.createSetZipJob = async function (set_rid) {
  const url = `/api/sets/${set_rid.replace('#', '')}/files/zip/jobs`
  const result = await axios.post(url)
  return result.data
}

web.getSetZipJobStatus = async function (set_rid, job_id) {
  const url = `/api/sets/${set_rid.replace('#', '')}/files/zip/jobs/${job_id}`
  const result = await axios.get(url)
  return result.data
}

web.getSetZipDownloadUrl = function (set_rid, job_id) {
  return `/api/sets/${set_rid.replace('#', '')}/files/zip/jobs/${job_id}/download`
}

web.createSourceProcess = async function (process, set_rid) {
  const url = `/api/queue/${process.service}/sources/${set_rid.replace('#', '')}`
  var result = await axios.post(url, process)
  return result
}

web.cancelProcess = async function (process_rid) {
  const url = `/api/queue/drain/${process_rid.replace('#', '')}`
  var result = await axios.get(url)
  return result
}

web.getBatch = async function (process_rid) {
  const url = `/api/batches/${process_rid.replace('#', '')}`
  const result = await axios.get(url)
  return result.data
}

web.pauseBatch = async function (process_rid) {
  const url = `/api/batches/${process_rid.replace('#', '')}/pause`
  const result = await axios.post(url)
  return result.data
}

web.resumeBatch = async function (process_rid) {
  const url = `/api/batches/${process_rid.replace('#', '')}/resume`
  const result = await axios.post(url)
  return result.data
}

web.cancelBatch = async function (process_rid) {
  const url = `/api/batches/${process_rid.replace('#', '')}/cancel`
  const result = await axios.post(url)
  return result.data
}

web.getActiveJobs = async function () {
  const result = await axios.get('/api/queue/jobs/active')
  return result.data
}

web.dismissJob = async function (rid) {
  const cleanRid = String(rid).replace('#', '')
  const result = await axios.post(`/api/queue/jobs/${cleanRid}/dismiss`)
  return result.data
}

web.createNode = async function (data) {
  var result = await axios.post(`/api/graph/vertices`, data)
  return result
}

web.deleteNode = async function (rid) {
  var response = await axios.delete(`/api/graph/vertices/${rid.replace('#', '')}`)
  return response
}

web.deleteProject = async function (rid) {
  var response = await axios.delete(`/api/projects/${rid.replace('#', '')}`)
  return response
}

web.setRelationAttribute = async function (rid, data) {
  var result = await axios.post(`/api/graph/edges/${rid.replace('#', '')}`, data)
  return result
}

web.setNodeAttribute = async function (rid, data) {
  var result = await axios.post(`/api/graph/vertices/${rid.replace('#', '')}`, data)
  return result
}

web.setProjectAttribute = async function (rid, data) {
  var result = await axios.put(`/api/projects/${rid.replace('#', '')}`, data)
  return result
}

web.getSourceInit = async function (rid) {
  var result = await axios.get(`/api/graph/vertices/${rid.replace('#', '')}/init`)
  return result.data
}

web.createROIs = async function (rid, data, width, height) {
  var postdata = { rois: data, width: width, height: height }
  var result = await axios.post(`/api/graph/vertices/${rid.replace('#', '')}/rois`, postdata)
  return result
}

web.saveImageROIs = async function (rid, set_rid, rois) {
  var result = await axios.post(
    `/api/images/${rid.replace('#', '')}/sets/${set_rid.replace('#', '')}/rois`,
    { rois },
  )
  return result
}

web.getImageROIs = async function (rid, set_rid) {
  var result = await axios.get(
    `/api/images/${rid.replace('#', '')}/sets/${set_rid.replace('#', '')}/rois`,
  )
  return result.data
}

web.updateImageROI = async function (rid, set_rid, roi_rid, rois) {
  var result = await axios.put(
    `/api/images/${rid.replace('#', '')}/sets/${set_rid.replace('#', '')}/rois/${roi_rid.replace('#', '')}`,
    { rois },
  )
  return result
}

web.deleteImageROI = async function (rid, set_rid, roi_rid) {
  var result = await axios.delete(
    `/api/images/${rid.replace('#', '')}/sets/${set_rid.replace('#', '')}/rois/${roi_rid.replace('#', '')}`,
  )
  return result
}

web.saveLayout = async function (positions, node) {
  var result = await axios.post(`/api/layouts`, { data: positions, target: node })
  return result
}

// Saved layouts are not read back yet: the desk is always laid out by dagre.
web.getLayoutByTarget = async function () {
  return {}
}

web.uploadFile = async function (fileObject, project_rid, set_rid, options = {}) {
  var formData = new FormData()
  formData.append('file', fileObject)
  if (options.noThumbnails) {
    formData.append('no_thumbnails', 'true')
  }

  const queryParams = []
  if (options.noThumbnails) queryParams.push('no-thumbnails=true')
  if (options.deleteOriginal === false) queryParams.push('delete_original=false')
  const queryString = queryParams.length > 0 ? '?' + queryParams.join('&') : ''

  if (set_rid)
    await axios.post(
      `/api/projects/${project_rid.replace('#', '')}/upload/${set_rid.replace('#', '')}${queryString}`,
      formData,
    )
  else
    await axios.post(`/api/projects/${project_rid.replace('#', '')}/upload${queryString}`, formData)
}

// Uploads many files into a Set in chunks with limited concurrency, reporting progress.
// Multiple files are only accepted onto a Set (not the main desk) per backend contract.
web.uploadFiles = async function (fileObjects, project_rid, set_rid, options = {}) {
  if (!set_rid) throw new Error('Multiple file upload is only supported for Sets')
  const files = Array.isArray(fileObjects) ? fileObjects : [fileObjects]

  const chunkSize = options.chunkSize || 20
  const concurrency = options.concurrency || 3
  const chunks = []
  for (let i = 0; i < files.length; i += chunkSize) {
    chunks.push(files.slice(i, i + chunkSize))
  }

  const queryParams = []
  if (options.noThumbnails) queryParams.push('no-thumbnails=true')
  if (options.deleteOriginal === false) queryParams.push('delete_original=false')
  const queryString = queryParams.length > 0 ? '?' + queryParams.join('&') : ''
  const url = `/api/projects/${project_rid.replace('#', '')}/upload/${set_rid.replace('#', '')}${queryString}`

  const results = { uploaded: [], failed: [] }
  let completed = 0

  async function sendChunk(chunk) {
    var formData = new FormData()
    chunk.forEach((file) => formData.append('file', file))
    try {
      var response = await axios.post(url, formData)
      var data = response.data
      if (data && (Array.isArray(data.uploaded) || Array.isArray(data.failed))) {
        results.uploaded.push(...(data.uploaded || []))
        results.failed.push(...(data.failed || []))
      } else if (data) {
        results.uploaded.push(data)
      }
    } catch (error) {
      var message = error?.response?.data?.message || error.message || 'Upload failed'
      chunk.forEach((file) => results.failed.push({ filename: file.name, error: message }))
    }
    completed += chunk.length
    if (typeof options.onProgress === 'function') {
      options.onProgress({ completed: completed, total: files.length })
    }
  }

  // Run chunks with limited concurrency
  let nextChunkIndex = 0
  async function worker() {
    while (nextChunkIndex < chunks.length) {
      const current = chunks[nextChunkIndex++]
      await sendChunk(current)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, chunks.length) }, worker))

  return results
}

export default web
