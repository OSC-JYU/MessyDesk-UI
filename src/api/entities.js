// Entities, tags and NER results.
// Thin wrappers over the legacy web.js client so old and new screens share one
// backend layer. Callers move here first; web.js is emptied as they do.
import web from '@/web.js'

export const getEntities = (...args) => web.getEntities(...args)
export const getEntitySchema = (...args) => web.getEntitySchema(...args)
export const getSetEntities = (...args) => web.getSetEntities(...args)
export const getEntityItems = (...args) => web.getEntityItems(...args)
export const getEntitiesByType = (...args) => web.getEntitiesByType(...args)
export const createEntity = (...args) => web.createEntity(...args)
export const linkEntityToItem = (...args) => web.linkEntityToItem(...args)
export const unLinkEntity = (...args) => web.unLinkEntity(...args)
export const getTags = (...args) => web.getTags(...args)
export const createTag = (...args) => web.createTag(...args)
export const getMachineTags = (...args) => web.getMachineTags(...args)
export const getMachineTagFiles = (...args) => web.getMachineTagFiles(...args)
export const getMachineTagMentions = (...args) => web.getMachineTagMentions(...args)
export const getNerRegions = (...args) => web.getNerRegions(...args)
export const getNerLabelGroups = (...args) => web.getNerLabelGroups(...args)
export const getNerLabelFiles = (...args) => web.getNerLabelFiles(...args)
export const getNerLabelMentions = (...args) => web.getNerLabelMentions(...args)
