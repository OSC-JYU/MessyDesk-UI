// Full-text search.
// Thin wrappers over the legacy web.js client so old and new screens share one
// backend layer. Callers move here first; web.js is emptied as they do.
import web from '@/web.js'

export const search = (...args) => web.search(...args)
export const getSearchInfo = (...args) => web.getSearchInfo(...args)
