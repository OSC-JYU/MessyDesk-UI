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
  // The file picked in the lineage, shown beside `file` (null when there is none), and this view's
  // choice of side by side or replacing instead of the user's setting ('on' | 'off' | null).
  compare: null,
  sideBySide: null,
  // A passage to show in a text: { fileRid, start, end } (code point offsets), set when a coded
  // passage is opened from the Tags page. Only the text with that rid uses it.
  focus: null,
})

// Opens `file` from a list of results, remembering the list for previous/next
// and, in `from`, the page to go back to ({ returnTo, kind }).
export function browseFromResults(file, query, results, index, from = {}) {
  fileBrowse.file = file
  fileBrowse.context = { mode: 'search', query, results, index, ...from }
}
