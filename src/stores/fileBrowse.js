import { reactive } from 'vue'

// The file open in the file viewer and how the user got there, so the viewer
// can offer previous/next. The old global store reads and writes the same
// fields (store.file, store.file_browse_context).
//
// context shapes:
//   null                                   file opened on its own
//   { mode: 'set', set_rid, set_label, file_count, skip, source_rid, source_label }
//   { mode: 'search', query, results: [{ rid, label, score, highlight }], index }
export const fileBrowse = reactive({
  file: null,
  context: null,
})

// Opens `file` from a list of results, remembering the list for previous/next.
export function browseFromResults(file, query, results, index) {
  fileBrowse.file = file
  fileBrowse.context = { mode: 'search', query, results, index }
}
