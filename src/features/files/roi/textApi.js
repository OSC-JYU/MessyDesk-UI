import { getNodeFile, getTextROIs, saveTextROIs, tagTextRegion, untagTextRegion, getTextCoverage } from '@/api/files.js'
import { createDeskTag, getTags } from '@/api/entities.js'
import {
  getCodingContent,
  getCodingCoverage,
  getCodingRegions,
  getCodingTags,
  saveCodingRegions,
  tagCodingRegion,
  untagCodingRegion,
} from '@/api/coding.js'

// Where the text editor reads and writes. The owner works on the desk's own routes; a coder works
// through the routes of their grant, which can read and write only their ROI set. A coder cannot
// make tags or import spans (`canCreateTags`, `canImport` are false).
export const ownerTextApi = {
  canCreateTags: true,
  canImport: true,
  content: (file) => getNodeFile(file),
  getRegions: (file, set) => getTextROIs(file, set),
  saveRegions: (file, set, map) => saveTextROIs(file, set, map),
  tag: (file, set, region, tag) => tagTextRegion(file, set, region, tag),
  untag: (file, set, region, tag) => untagTextRegion(file, set, region, tag),
  tags: async (desk) => (await getTags({ projectRid: desk }))?.result || [],
  createTag: async (desk, label) => (await createDeskTag(desk, { type: 'Tag', label }))?.result?.[0],
  coverage: (set) => getTextCoverage(set),
}

export function codingTextApi() {
  return {
    canCreateTags: false,
    canImport: false,
    content: (file, set) => getCodingContent(set, file),
    getRegions: (file, set) => getCodingRegions(set, file),
    saveRegions: (file, set, map) => saveCodingRegions(set, file, map),
    tag: (file, set, region, tag) => tagCodingRegion(set, file, region, tag),
    untag: (file, set, region, tag) => untagCodingRegion(set, file, region, tag),
    tags: async (_desk, set) => (await getCodingTags(set))?.result || [],
    createTag: null,
    coverage: (set) => getCodingCoverage(set),
  }
}
