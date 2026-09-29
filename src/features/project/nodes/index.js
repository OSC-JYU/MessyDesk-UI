import { markRaw } from 'vue'
import FileNode from './FileNode.vue'
import ImageNode from './ImageNode.vue'
import PdfNode from './PdfNode.vue'
import ProcessNode from './ProcessNode.vue'
import SetNode from './SetNode.vue'
import EmptyDeskNode from './EmptyDeskNode.vue'
import { RoiSetNode, SearchSetNode, SourceNode, ZipNode } from './SmallNodes.js'

// Vue Flow node component by node type. File types not listed here are
// drawn by FileNode (see nodeTypeFor).
const FILE_TYPES = [
  'file',
  'text',
  'csv',
  'html',
  'data',
  'json',
  'similarity_results.json',
  'pos.json',
  'bow.json',
  'dspace7.json',
  'solr.json',
  'human.json',
  'ner.json',
  'osd.json',
  'ocr.json',
  'polygons.json',
  'faiss.json',
  'error.json',
]

export const nodeTypes = {
  ...Object.fromEntries(FILE_TYPES.map((type) => [type, markRaw(FileNode)])),
  image: markRaw(ImageNode),
  pdf: markRaw(PdfNode),
  process: markRaw(ProcessNode),
  setprocess: markRaw(ProcessNode),
  filter: markRaw(ProcessNode),
  set: markRaw(SetNode),
  'search-set': markRaw(SearchSetNode),
  'roi-set': markRaw(RoiSetNode),
  nextcloud: markRaw(SourceNode),
  dspace7: markRaw(SourceNode),
  zip: markRaw(ZipNode),
  empty: markRaw(EmptyDeskNode),
}

export function nodeTypeFor(type) {
  return nodeTypes[type] ? type : 'file'
}
