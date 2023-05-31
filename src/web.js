import axios from "axios"
let web = {}
// if(window.location.hostname == 'localhost')
// 	axios.defaults.baseURL = ''
// else
	axios.defaults.baseURL = import.meta.env.VITE_PUBLIC_PATH
	//axios.defaults.baseURL = ''

web.search = async function(search) {
	var result = await axios.get(`/api/search?search=${search}`)
	return result.data
}

web.rawQuery = async function(query) {
	var result = await axios.post(`/api/query`, {query: query})
	return result.data
}

web.getListOfNonConnected = async function(type, relation, target) {
	var path = `/api/documents?type=${type}`
	if(relation && target) path = `/api/documents?type=${type}&relation=${relation}&target=${target.replace('#','')}`
	var result = await axios.get(path)
	return result
}

web.getGraph = async function(query, current_node, cluster) {

	var result = await axios.post('/api/graph/query', {query:query, current: current_node, cluster: cluster})
	return result
}

web.getSchemaLinks = async function(rid) {
	var query = `MATCH (s:Schema)-[r]-(t:Schema) WHERE id(s) = "#${rid}"
	RETURN COALESCE(s.label, s._type) as source,  TYPE(r) as type, r.label as label, r.label_rev as label_rev, COALESCE(t.label, t._type) as target, id(t) as target_id, id(r) as rid, r.compound as compound, r.tags as tags, r as relation,
	       CASE WHEN STARTNODE(r) = s THEN 'outgoing' ELSE 'incoming' END AS direction`
	 var response = await axios.post('/api/query', {query:query})
	 // clean up cypher.nulls from tags
	 for(var s of response.data.result) {
		 if(!Array.isArray(s.tags) && s.tags.trim() == 'cypher.null') s.tags = []
	 }
	 return response
}

web.getServicesForFile = async function(file_rid) {
	var result = await axios.get(`/api/services/files/${file_rid.replace('#','')}`)
	return result.data
}

web.getList = async function(schema) {
	var query = `MATCH (s:${schema}) RETURN s.label AS label, s.description AS description, id(s) AS rid ORDER BY label`
	var response = await axios.post('/api/query', {query:query})
	return response.data
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

web.getMenus = async function() {
	var result = await axios.get(`/api/menus`)
	return result.data
}

web.getMaps = async function() {
	var result = await axios.get(`/api/maps`)
	return result.data
}

web.getFiles = async function(dir) {
	var result = await axios.get(`/api/files/` + dir)
	return result.data
}

web.getStats = async function() {
	var result = await axios.get(`/api/graph/stats`)
	return result.data
}

web.importFile = async function(dir, filename, mode) {
	if(mode) filename = filename + '&mode=' + mode
	var result = await axios.post(`/api/` + dir + '/import?filename=' + filename)
	return result.data
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

web.getNodeAttributes = async function(rid) {
	var result = await axios.get(`/api/documents/${rid.replace('#','')}`)
	return result.data.result
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

// web.getNodeList = async function(type) {
//
// 	var result = await axios.get(`/api/graph/vertices/${type}`)
// 	return result.data.result
// }


web.createFileProcess = async function(process, file_rid) {

	const url = `/api/queue/${process.id}/files/${file_rid.replace('#', '')}`
	console.log(url)
	var result = await axios.post(url, process)
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

web.connect = async function(from, relation, to) {

	var result = await axios.post(`/api/graph/edges`, {from:from, relation:relation, to:to})
	return result
}

web.connectMe = async function(relation, to) {

	var result = await axios.post(`/api/graph/edges/connect/me`, {rel_type:relation, to:to})
	return result
}

web.unConnectMe = async function(relation, to) {

	var result = await axios.post(`/api/graph/edges/unconnect/me`, {rel_type:relation, to:to})
	return result
}

web.setRelationAttribute = async function(rid, data) {
	var result = await axios.post(`/api/graph/edges/${rid.replace('#','')}`, data)
	return result
}

web.setNodeAttribute = async function(rid, data) {
	var result = await axios.post(`/api/graph/vertices/${rid.replace('#','')}`, data)
	return result
}

web.removeEdgeByRID = async function(rid) {
	var result = await axios.delete(`/api/graph/edges/${rid.replace('#','')}`)
	return result
}

web.connectSchema = async function(from, relation, to) {
	var result = await axios.post(`/api/graph/edges`, {from:from, relation:relation, to: to})
	return result
}

web.saveLayout = async function(positions, node) {
	var result = await axios.post(`/api/layouts`, {data:positions, target: node})
	return result
}

web.getLayoutByTarget = async function(rid) {
	var result = await axios.get(`/api/layouts/${rid.replace('#','')}`)
	return result.data
}

web.getGitlabCommits = async function(id) {
	var result = await axios.get(`/api/gitlab/repositories/${id}/commits`)
	return result.data
}

web.getDockerContainerLogs = async function(id) {
	var result = await axios.get(`/api/docker/containers/${id}/logs`)
	return result.data
}

web.getDockerContainerInspect = async function(id) {
	var result = await axios.get(`/api/docker/containers/${id}/inspect`)
	return result.data
}

web.uploadImage = async function(fileObject, rid) {
	var formData = new FormData()
	formData.append("image", fileObject)
	await axios.post(`/api/upload/${rid.replace('#','')}`, formData)
}

web.uploadFile = async function(fileObject, type) {
	var formData = new FormData()
	formData.append("file", fileObject)
	await axios.post(`/api/${type}/upload/`, formData)
}

export default web
