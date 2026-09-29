import { reactive } from 'vue'
import { session } from "../stores/session.js";
import { fileBrowse } from "../stores/fileBrowse.js";

export const store = reactive({
  update: 0,
  update_data: null,
  // The signed-in user now lives in stores/session.js; old readers keep store.user.
  get user() { return session.user },
  set user(value) { session.user = value },
  x: 0,
  y: 0,
  process: {},
  task_id: '',
  view: null,
  new_node_type: '',
  new_node_id: null,
  new_node_relation: null,
  current_node: {data:{name:'', type: ''}},
  tags: [],
  tab: 0,
  schemas: [],
  queries: [],
  menus: [],
  groups: [],
  cruncher_filter: '',
  graph_node_update: '',
  get filter_editor() { return fileBrowse.roiTarget },
  set filter_editor(value) { fileBrowse.roiTarget = value },
  process_creator_open: false,
  uploader_open: false,
  set_uploader_open: false,
  node_deleter_open: false,
  project_deleter_open: false,
  importer_open: false,
  exporter_open: false,
  crunchers_open: false,
  set_creator_open: false,
  source_creator_open: false,
  source_creator_type: '',
  search_open: false,
  graph_style: [],
  root_nodes: [],
  projects: [],
  setdata: {},
  set_browse_context: null,
  // The open file and its browse context live in stores/fileBrowse.js.
  get file() { return fileBrowse.file },
  set file(value) { fileBrowse.file = value },
  file_count: null,
  skip: null,
  source: null,
  get file_browse_context() { return fileBrowse.context },
  set file_browse_context(value) { fileBrowse.context = value },
  current_project: {},
  set_panel_cache: null,
  reorder_target: '',
  settings_show_descriptions: true,
  settings_show_entities: true,
  running_processes: {},


  reload(update) {
    this.update_data = null || update
      //this.update_data = update
    this.update++
  },

  current() {
		if(this.current_node && !this.current_node.data) {
			return {data: {name:'', type: ''}}
		} else {
			return this.current_node
		}
        return {data: {name:'', type: ''}}
	},
  graphUpdate(id) {
      return this.graph_node_update
  }
})

