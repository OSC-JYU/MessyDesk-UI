// Files, versions, ROIs and uploads.
// Thin wrappers over the legacy web.js client so old and new screens share one
// backend layer. Callers move here first; web.js is emptied as they do.
import web from '@/web.js'

export const getFiles = (...args) => web.getFiles(...args)
export const importFile = (...args) => web.importFile(...args)
export const getDocInfo = (...args) => web.getDocInfo(...args)
export const getNodeFile = (...args) => web.getNodeFile(...args)
export const getNodeFileBlob = (...args) => web.getNodeFileBlob(...args)
export const createFileVersion = (...args) => web.createFileVersion(...args)
export const revertFileVersion = (...args) => web.revertFileVersion(...args)
export const createFileThumbnail = (...args) => web.createFileThumbnail(...args)
export const createSetThumbnails = (...args) => web.createSetThumbnails(...args)
export const createROIs = (...args) => web.createROIs(...args)
export const saveImageROIs = (...args) => web.saveImageROIs(...args)
export const getImageROIs = (...args) => web.getImageROIs(...args)
export const updateImageROI = (...args) => web.updateImageROI(...args)
export const deleteImageROI = (...args) => web.deleteImageROI(...args)
export const uploadFile = (...args) => web.uploadFile(...args)
export const uploadFiles = (...args) => web.uploadFiles(...args)
export const createSetZipJob = (...args) => web.createSetZipJob(...args)
export const getSetZipJobStatus = (...args) => web.getSetZipJobStatus(...args)
export const getSetZipDownloadUrl = (...args) => web.getSetZipDownloadUrl(...args)
