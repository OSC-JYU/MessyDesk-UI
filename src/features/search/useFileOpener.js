import { useRouter } from 'vue-router'
import { getDocInfo } from '@/api/files.js'
import { browseFromResults } from '@/stores/fileBrowse.js'
import { browseList } from './results.js'

// Opens a result in the file viewer, remembering the result list so the
// viewer can step through it. Inside a desk the file opens in that desk;
// otherwise in the stand-alone file view.
export function useFileOpener() {
  const router = useRouter()

  return async function openResult({ result, index, results, query, projectRid }) {
    const file = await getDocInfo(result.rid)
    browseFromResults(file, query, browseList(results), index)
    const fileRid = result.rid.replace('#', '')
    if (projectRid) {
      router.push({ name: 'project-file', params: { rid: projectRid.replace('#', ''), fileRid } })
    } else {
      router.push({ name: 'files', params: { rid: fileRid } })
    }
  }
}

// The desk a result should open in: the one in the route, or the only
// selected one.
export function deskForResults(routeRid, selectedRids) {
  if (routeRid) return `#${String(routeRid).replace('#', '')}`
  return selectedRids.length === 1 ? selectedRids[0] : ''
}
