<template>

	<!-- Modal -->
	<div v-if="store.node_creator_open" class="modal modal-lg fade show" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true" style="display:block">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<h4 class="modal-title" id="exampleModalLabel">
						<span v-if="store.new_node_relation">{{store.new_node_relation.label}} - </span>
						<span v-if="store.new_node_type"> {{getSchema(store.new_node_type).label}}</span>
					</h4>

				</div>

				<div class="modal-body">
					<template v-if="props.mode == 'schema'">

						{{props.mode}}
						<input type="text" v-model="state.new_node._type" class="form-control" placeholder="type" aria-label="name" aria-describedby="basic-addon1">
						<br>
						<input type="text" v-model="state.new_node.label" class="form-control" placeholder="label" aria-label="name" aria-describedby="basic-addon1">
					</template>

					<template v-else>
						<select v-if="store.new_node_type == ''" v-model="store.new_node_type" class="w-100 custom-select" id="inputGroupSelect04">
							<option value=''>choose type</option>
							<option v-for="schema in state.schemas" :key="schema.type" :value="schema.type">
								{{schema.label}}
							</option>
						</select>
						<div v-if="state.current_schema" >
							<br>
							<!-- <input type="text" v-model="add_new.label" class="form-control" placeholder="nimi" aria-label="name" aria-describedby="basic-addon1"> -->

							<!-- SHOW NODE ATTRBIUTES -->
							<div v-for="(value, field) of state.new_node" class="input-group mb-3">
								<template v-if="field == 'description'">
									<textarea  v-model="state.new_node[field]" rows="3" cols="30" :placeholder="field" class="form-control"></textarea>
								</template>
								<template v-else>
									<input v-if="field != 'type' && !field.startsWith('_')" type="text" v-model="state.new_node[field]" class="form-control" :placeholder="field" aria-label="name" aria-describedby="basic-addon1">
								</template>
							</div>
						</div>
					</template>
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
		store.node_creator_open = false
	}

	onMounted(async()=> {
		state.schemas = await web.getSchemas()
	})

</script>
