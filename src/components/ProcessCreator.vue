<template>

	<!-- Modal -->
	<div v-if="store.process_creator_open" class="modal modal-lg fade show" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true" style="display:block">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<h4 class="modal-title" id="exampleModalLabel">
						<span v-if="store.process"> {{ store.process.name}}</span>
					</h4>

				</div>

				<div class="modal-body">
					<div>
						{{ store.process.description }}
					</div>

				</div>

				<div class="modal-footer">
					<button @click="close()" type="button" class="btn btn-secondary" >Cancel</button>
					<button v-if="state.current_schema || props.mode == 'schema'" @click=createNode() type="button" class="btn btn-primary">Create</button>
					<div v-if="state.error" class="alert alert-danger">{{state.error}}</div>
				</div>
			</div>
		</div>
	</div>

</template>


<script setup>
    import { onMounted, watch, reactive, ref} from "vue";
	import { useRouter, useRoute } from 'vue-router'
    import {store} from "./Store.js";
    import web from "../web.js";

	const router = useRouter();


	var state = reactive({
		schemas:[],
		current_type: '',
		current_schema: null,
		new_node: {},
		error: ''
	})
	var new_node = reactive({})
    var created = reactive([])

	const props = defineProps({
        mode: ''
    })

	const emit = defineEmits(['createConnection'])

	watch(
      () => state.current_type,
      (newValue, oldValue) => {
		  if(newValue == '') {
			  state.current_schema = null
			  return
		  }
        state.current_schema = state.schemas.find(x => x.type == newValue)
		var fields = {}
		for(var field in state.current_schema.schema) {
			if(!['@rid', '@type','_type','_active'].includes(field))
				fields[field] = ''
		}
		fields['label'] = ''
		fields['description'] = ''
		fields.type = state.current_type
		state.new_node = fields
    })
    watch(
      () => store.new_node_type,
      async (newValue, oldValue) => {
        state.current_type = store.new_node_type
    })


	function getSchema(type) {
		return state.schemas.find(x => x.type == type)
	}

	async function createNode() {
		state.error = ''
		if(props.mode == 'schema') {
			state.new_node.type = 'Schema'
		}

		if(typeof state.new_node.label !== 'undefined' && state.new_node.label == '') {
			state.error = 'Label is required value!'
			return
		}
		// id is required if schema its defined in schema
		if(typeof state.new_node.id !== 'undefined' && state.new_node.id == '') {
			state.error = 'ID is required value!'
			return
		}
		var res = await web.createNode(state.new_node)
		var node = res.data.result[0]

		// if there is 'new_node_relation', nodecreator was opened from relation editor
		if(props.mode == "graph" && store.new_node_relation) {
			emit('createConnection', node['@rid'], store.new_node_relation)
			close()
		} else if(state.new_node.type == 'Schema') {
			close()
			router.push({ name: 'schema', query: { node: node['@rid'].replace('#', '') } })
		} else {
			close()
			router.push({ name: 'graph', query: { node: node['@rid'].replace('#', '') } })
		}

		// if(state.new_node.type == 'Schema')
		// 	router.push({ name: 'schema', query: { node: node['@rid'].replace('#', '') } })
		// else
		// 	router.push({ name: 'graph', query: { node: node['@rid'].replace('#', '') } })
		//created.push(res.data.result[0])


	}

	function close() {
		store.new_node_type = ''
		store.new_node_relation = null
		store.process_creator_open = false
	}

	onMounted(async()=> {
		state.schemas = await web.getSchemas()
	})

</script>
