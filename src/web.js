import axios from "axios"
import { en } from "vuetify/locale"
let web = {}

axios.defaults.baseURL = import.meta.env.VITE_API_PATH

axios.interceptors.response.use(
	(response) => response,
	(error) => {
	  if (error.response) {
		// Server responded with error status (4xx, 5xx)
		console.error('API Error:', {
		  status: error.response.status,
		  data: error.response.data
		});
		return Promise.reject({
		  status: error.response.status,
		  message: error.response.data?.message || 'Server error occurred'
		});
	  } else if (error.request) {
		// Request made but no response received
		console.error('Network Error:', error.request);
		return Promise.reject({
		  status: 0,
		  message: 'Network error - no response received' 
		});
	  } else {
		// Error in request configuration
		console.error('Request Error:', error.message);
		return Promise.reject({
		  status: 0,
		  message: 'Request configuration error'
		});
	  }
	}
  );

web.sso = async function () {
	var response = await axios.get('/api/sso')
	return response
}

web.ready = async function() {
	var response = await axios.get('/api')
	return response
}

web.getError = async function(rid) {
	var result = await axios.get(`/api/errors/${rid}`)
	return result.data
}

web.search = async function(search) {
	var result = await axios.post(`/api/search`, {query: search})
	return result.data
}

web.savePrompt = async function(prompt) {
	var result = await axios.post(`/api/prompts`, prompt)
	return result.data
}

web.getQueue = async function(service_id) {
	var result = await axios.get(`/api/queue/${service_id}/status`)
	return result.data
}

web.rawQuery = async function(query) {
	var result = await axios.post(`/api/query`, {query: query})
	return result.data
}

web.getGraph = async function(query, current_node, cluster) {
	var result = await axios.post('/api/graph/query', {query:query, current: current_node, cluster: cluster})
	return result
}
// Add response interceptor to handle errors globally




web.createProject = async function(name, description, x, y) {
	var data = {
		"label": name,
		"description": description,
		"position": {x: x, y: y}
	}
	var response = await axios.post('/api/projects', data)
}

web.createSet = async function(project_rid, name, description) {
	project_rid = project_rid.replace('#','')
	var data = {
		"label": name,
		"description": description
	}
	var response = await axios.post(`/api/projects/${project_rid}/sets`, data)
	return response.data
}

web.createSource = async function(project_rid, state, type) {
	project_rid = project_rid.replace('#','')
	var data = {
		"type": type,
		"label": state.source_name,
		"url": state.url,
		"description": state.description
	}

	var response = await axios.post(`/api/projects/${project_rid}/sources`, data)
	return response.data
}

web.getServices = async function(rid) {
	var result = await axios.get(`/api/services`)
	return result.data
}

web.getPrompts = async function(rid) {
	var result = await axios.get(`/api/prompts`)
	return result.data
}

web.getUsers = async function(rid) {
	var result = await axios.get(`/api/users`)
	return result.data
}

web.addPermissionRequest = async function() {
	try {
		var result = await axios.post(`/api/permissions/request`, {})
		return result.data
	} catch (error) {
		throw(error)
		if(error.response)
			return error.response.data
		else
			return error
	}
}


web.getPermissionRequests = async function() {
	var result = await axios.get(`/api/permissions/request`)
	return result.data
}

web.removePermissionRequest = async function(rid) {
	var result = await axios.delete(`/api/permissions/request/${rid.replace('#','')}`)
	return result.data
}

web.createUser = async function(data) {
	try {
		var result = await axios.post(`/api/users`, data)
		return result.data
	} catch (error) {
		if(error.response)
			return error.response.data
		else
			return error
	}
}

web.getServicesForFile = async function(file_rid, filter) {
	var filter_query = ''
	if(filter) filter_query = '?filter='+filter
	var result = await axios.get(`/api/services/files/${file_rid.replace('#','')}${filter_query}`)
	return result.data
}

web.getInitData = async function(service_id) {
	var result = await axios.get(`/api/services/${service_id}/init`)
	return result.data
}

web.getProcessParams = async function(process_path) {
	var result = await axios.get(process_path)
	return result
}

web.getMe = async function() {
	var result = await axios.get(`/api/me`)
	return result.data
}

web.getSchemas = async function() {
	var result = await axios.get(`/api/schemas`)
	return result.data.result
}

web.getQueries = async function(menu) {
	var result = await axios.get(`/api/queries`)
	return result.data.result
}

web.getTags = async function() {
	var result = await axios.get(`/api/tags`)
	return result.data.result
}

web.getGroups = async function() {
	var result = await axios.get(`/api/groups`)
	return result.data
}

web.getProjects = async function() {
	var result = await axios.get(`/api/projects`)
	return result.data
}

web.getProject = async function(rid) {
	var result = await axios.get(`/api/projects/${rid.replace('#', '')}`)
	return result.data
}

web.getSetFiles = async function(rid, skip, limit) {
	var query = ''
	if(skip && limit) query = '?skip=' + skip + '&limit=' + limit
	else if(skip) query += '?skip=' + skip
	else if(limit) query += '?limit=' + limit
	var result = await axios.get(`/api/sets/${rid.replace('#', '')}/files${query}`)
	return result.data
}


web.getFiles = async function(dir) {
	var result = await axios.get(`/api/files/` + dir)
	return result.data
}

web.getEntities = async function(dir) {
	var result = await axios.get(`/api/entities`)
	return result.data
}

web.getEntitySchema = async function(dir) {
	var result = await axios.get(`/api/entities/types`)
	return result.data
}

web.getEntityItems = async function(entities) {
	var entity_rids = entities.map(e => e['@rid'].replace('#', ''))
	var result = await axios.get(`/api/entities/items?entities=${entity_rids.join(',')}`)
	return result.data
}

web.getEntitiesByType = async function(type) {
	var result = await axios.get(`/api/entities/types/${type}`) 
	return result.data
}

web.createEntity = async function(type, label) {
	var result = await axios.post(`/api/entities`, {type: type, label: label})
	return result.data
}

web.linkEntityToItem =  async function(entityRID, itemRId) {
	var result = await axios.post(`/api/entities/${entityRID.replace('#','')}/vertex/${itemRId.replace('#','')}`)
	return result.data
}

web.unLinkEntity =  async function(entityRID, itemRId) {
	var result = await axios.delete(`/api/entities/${entityRID.replace('#','')}/vertex/${itemRId.replace('#','')}`)
	return result.data
}

web.getTags = async function() {
	var result = await axios.get(`/api/tags`)
	return result.data
}

web.createTag = async function(label) {
	var result = await axios.post(`/api/tags`, {label: label})
	return result.data
}

web.getStats = async function() {
	var result = await axios.get(`/api/graph/stats`)
	return result.data
}

web.importFile = async function(dir, filename, mode) {
	if(mode) filename = filename + '&mode=' + mode
	var result = await axios.post(`/api/` + dir + '/import?filename=' + filename)
	return result
}

web.getStyle = async function() {
	var result = await axios.get(`/api/styles`)
	for(var style of result.data) {
		for(var key in style.style) {

			// eval functions from json
			if(typeof style.style[key] === 'string' && style.style[key].startsWith('(')) {
				var style_str = style.style[key].replace(/##/g,"'")
				style.style[key] = eval(style_str)
			}
		}
	}
	return result.data
}

web.getDocInfo = async function(rid) {
	var result = await axios.get(`/api/documents/${rid.replace('#','')}`)
	console.log('docinfo')
	console.log(result.data)
	if(result.data && result.data.rois) {
		var count = 0
		for(var roi of result.data.rois) {
			//roi.id = roi['@rid']
			roi['index'] = count
			roi['id'] = count
			count++	
		}
		
	}
	return result.data
}

web.getNodeFile = async function(rid) {
	var result = await axios.get(`/api/files/${rid.replace('#','')}`)
	return result.data
}

web.getNodePath = async function(rid) {
	var result = await axios.get(`/api/graph/traverse/${rid.replace('#','')}/in`)
	return result.data
}

web.getSchemaAndData = async function(rid) {
	var result = await axios.get(`/api/graph/vertices/${rid.replace('#','')}`)
	return result.data
}

web.getMyGraph = async function(rel_types=[], node_types=[],q_return='') {
	if(!Array.isArray(rel_types)) rel_types = [rel_types]
	if(!Array.isArray(node_types)) node_types = [node_types]
	var result = await axios.post('/api/graph/query/me', {rel_types:rel_types, node_types:node_types, return:q_return})
	return result
}

web.createFileProcess = async function(process, file_rid) {

	const url = `/api/queue/${process.service}/files/${file_rid.replace('#', '')}`
	console.log(url)
	var result = await axios.post(url, process)
	return result
}

web.createROIProcess = async function(process, file_rid) {

	const url = `/api/queue/${process.service}/files/${file_rid.replace('#', '')}/roi`
	console.log(url)
	var result = await axios.post(url, process)
	return result
}

web.createSetProcess = async function(process, set_rid) {

	const url = `/api/queue/${process.service}/sets/${set_rid.replace('#', '')}`
	var result = await axios.post(url, process)
	return result
}

web.createSourceProcess = async function(process, set_rid) {

	const url = `/api/queue/${process.service}/sources/${set_rid.replace('#', '')}`
	var result = await axios.post(url, process)
	return result
}

web.cancelProcess = async function(process_rid) {

	const url = `/api/queue/${process_rid.service}/drain/${process_rid.replace('#', '')}`
	var result = await axios.get(url)
	return result
}

web.createNode = async function(data) {

	var result = await axios.post(`/api/graph/vertices`, data)
	return result
}

web.deleteNode = async function(rid) {

	var response = await axios.delete(`/api/graph/vertices/${rid.replace('#','')}`)
	return response
}

web.deleteProject = async function(rid) {

	var response = await axios.delete(`/api/projects/${rid.replace('#','')}`)
	return response
}


web.setRelationAttribute = async function(rid, data) {
	var result = await axios.post(`/api/graph/edges/${rid.replace('#','')}`, data)
	return result
}

web.setNodeAttribute = async function(rid, data) {
	var result = await axios.post(`/api/graph/vertices/${rid.replace('#','')}`, data)
	return result
}

web.setProjectAttribute = async function(rid, data) {
	var result = await axios.put(`/api/projects/${rid.replace('#','')}`, data)
	return result
}

web.getSourceInit = async function(rid) {
	var result = await axios.get(`/api/graph/vertices/${rid.replace('#','')}/init`)
	return result.data
}


web.createROIs = async function(rid, data, width, height) {
	var postdata = {rois: data, width: width, height: height}
	var result = await axios.post(`/api/graph/vertices/${rid.replace('#','')}/rois`, postdata)
	return result
}

web.saveLayout = async function(positions, node) {
	var result = await axios.post(`/api/layouts`, {data:positions, target: node})
	return result
}

web.getLayoutByTarget = async function(rid) {
	return {}
	var result = await axios.get(`/api/layouts/${rid.replace('#','')}`)
	return result.data
}


web.uploadFile = async function(fileObject, project_rid, set_rid) {
	var formData = new FormData()
	formData.append("file", fileObject)
	if(set_rid) 
		await axios.post(`/api/projects/${project_rid.replace('#','')}/upload/${set_rid.replace('#','')}`, formData)
	else
		await axios.post(`/api/projects/${project_rid.replace('#','')}/upload`, formData)
}



export default web
