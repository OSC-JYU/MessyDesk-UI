import { reactive } from 'vue'
import web from "../web.js";

export const store = reactive({
  update: 0,
  update_data: null,
  user: null,
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
  process_creator_open: false,
  uploader_open: false,
  node_deleter_open: false,
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
  current_project: {},
  reorder_target: '',
  settings_show_descriptions: true,
  settings_show_entities: true,


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

