// Users, permission requests and service groups.
// Thin wrappers over the legacy web.js client so old and new screens share one
// backend layer. Callers move here first; web.js is emptied as they do.
import web from '@/web.js'

export const getUsers = (...args) => web.getUsers(...args)
export const getPermissionRequests = (...args) => web.getPermissionRequests(...args)
export const removePermissionRequest = (...args) => web.removePermissionRequest(...args)
export const createUser = (...args) => web.createUser(...args)
export const updateUserServiceGroups = (...args) => web.updateUserServiceGroups(...args)
export const getServiceGroups = (...args) => web.getServiceGroups(...args)
export const createServiceGroup = (...args) => web.createServiceGroup(...args)
export const updateServiceGroup = (...args) => web.updateServiceGroup(...args)
export const deleteServiceGroup = (...args) => web.deleteServiceGroup(...args)
export const uploadServiceGroupLogo = (...args) => web.uploadServiceGroupLogo(...args)
