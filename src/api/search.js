// Full-text search.
// Thin wrappers over the Axios client in client.js, grouped by area.
import web from './client.js'

export const search = (...args) => web.search(...args)
export const getSearchInfo = (...args) => web.getSearchInfo(...args)
export const getSemanticIndexes = (...args) => web.getSemanticIndexes(...args)
export const startSemanticSearch = (...args) => web.startSemanticSearch(...args)
export const getSemanticSearch = (...args) => web.getSemanticSearch(...args)
