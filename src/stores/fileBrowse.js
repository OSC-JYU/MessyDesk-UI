import { reactive } from 'vue'

// The file open in the file viewer and how the user got there, so the viewer
// can offer previous/next. The old global store reads and writes the same
// fields (store.file, store.file_browse_context).
//
// context shapes:
//   null                                   file opened on its own
//   { mode: 'set', set_rid, set_label, file_count, skip, source_rid, source_label }
//   { mode: 'search', query, results: [{ rid, label, score, highlight }], index,
//     returnTo, kind }   returnTo: the results page (route location) to go
//                        back to; kind: 'search' or 'tags'
export const fileBrowse = reactive({
  file: null,
  context: null,
  // The ROI set being edited, when the viewer is in ROI editing mode (set
  // from the desk; the old store calls it filter_editor).
  roiTarget: null,
  // Show text files as rendered Markdown.
  markdown: false,
})

// Opens `file` from a list of results, remembering the list for previous/next
// and, in `from`, the page to go back to ({ returnTo, kind }).
export function browseFromResults(file, query, results, index, from = {}) {
  fileBrowse.file = file
  fileBrowse.context = { mode: 'search', query, results, index, ...from }
}
