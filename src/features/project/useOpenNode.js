import { useRouter } from 'vue-router'
import { getSetFiles, getNodePath } from '@/api/projects.js'
import { getDocInfo } from '@/api/files.js'
import { fileBrowse } from '@/stores/fileBrowse.js'
import { setContextToQuery } from '@/features/files/browseQuery.js'
import { ridParam } from '@/features/files/fileTypes.js'
import {
  isFileLike,
  isImageLike,
  isRoiJson,
  isSetLike,
  opensAsFile,
  roiSourceFromPath,
  roiSourceNode,
} from './nodeKinds.js'

// Opens a file in the viewer, optionally as file `index` of `set` (so the
// viewer can step through the set) and with an ROI set to edit regions of.
export function useOpenFile(workspace) {
  const router = useRouter()

  return async function openFile(rid, { set = null, total = 0, index = 0, roiSet = null } = {}) {
    fileBrowse.roiTarget = roiSet
    fileBrowse.file = await getDocInfo(rid).catch(() => null)
    fileBrowse.context = set
      ? {
          mode: 'set',
          set_rid: set.id,
          set_label: set.data?.label || null,
          file_count: total,
          skip: index,
          source_rid: null,
          source_label: null,
        }
      : null
    router.push({
      name: 'project-file',
      params: { rid: ridParam(workspace.state.deskRid), fileRid: ridParam(rid) },
      query: setContextToQuery(fileBrowse.context),
    })
  }
}

// What double-clicking a node does: open a file in the viewer, open a set
// in the set browser, or open the ROI editor on the images of an ROI set.
export function useOpenNode(workspace, flow, { openSet }) {
  const openFile = useOpenFile(workspace)

  async function openRoiSet(node) {
    const source = roiSourceNode(node, flow.getIncomers)
    if (source && (isImageLike(source) || (isFileLike(source) && !isRoiJson(source)))) {
      return openFile(source.id, { roiSet: node })
    }
    const fromPath = roiSourceFromPath(await getNodePath(node.id).catch(() => []))
    if (fromPath) return openFile(fromPath, { roiSet: node })
    if (source && isSetLike(source)) {
      const preview = await getSetFiles(source.id, 0, 2).catch(() => null)
      const only = preview?.files?.[0]
      if (Number(preview?.file_count) === 1 && only) {
        return openFile(only['@rid'], { set: source, total: 1, index: 0, roiSet: node })
      }
      return openSet(source, node)
    }
    return openSet(node, null)
  }

  return async function openNode(node) {
    workspace.select(node)
    if (node.type === 'set') return openSet(node, null)
    if (node.type === 'roi-set') return openRoiSet(node)
    if (opensAsFile(node)) return openFile(node.id)
  }
}
