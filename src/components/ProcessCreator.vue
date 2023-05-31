<template>

	<!-- Modal -->
	<div v-if="store.process_creator_open" class="modal modal-lg fade show" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true" style="display:block">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
						Add Cruncher <img src="icons/cookie-bite-solid.svg"/>
				</div>

				<div class="modal-body">
					<h4 v-if="store.process"> {{ store.process.crunchers[store.process_id].name}}</h4>
					
					<div>{{ store.process.crunchers[store.process_id].description }} </div>

					<div class="card">
						<div class="card-header">Settings</div>
						<div class="card-body">
							<div v-if="store.process.params_help" >
								<div v-for="(help, key) in store.process.params_help" :key="key" class="input-group mb-3">
									<div class="input-group-prepend">
										<span class="input-group-text" id="basic-addon1">{{ help.name }}</span>
									</div>
									<input v-model="state.out_params[key]" type="text" class="form-control" placeholder=""  aria-label="Username" aria-describedby="basic-addon1">
									<div>{{ help.help }}</div>
								</div>
						</div>
							<div v-else>This cruncher has no settings, just click "Crunch!".</div>
						</div>
					</div>
					

				
				</div>


				<div class="modal-footer">
					{{ store.current().data.name }}
					<button @click="close()" type="button" class="btn btn-secondary" >Cancel</button>
					<button v-if="store.process_id " @click=createProcess() type="button" class="btn btn-primary">Crunch!</button>
					<img src="icons/cookie-bite-solid.svg"/>
					<div v-if="state.error" class="alert alert-danger">{{state.error}}</div>
				</div>

				<div class="card">
						<div class="card-header">About Service</div>
						<div class="card-body">
							{{ store.process.description }}
						</div>
					</div>
			</div>
		</div>
	</div>

</template>


<script setup>
    import { onMounted, onActivated, watch, reactive, ref} from "vue";
	import { useRouter, useRoute } from 'vue-router'
    import {store} from "./Store.js";
    import web from "../web.js";

	const router = useRouter();


	var state = reactive({
		current_type: '',
		current_schema: null,
		out_params: {},
		error: ''
	})
	var new_node = reactive({})
    var created = reactive([])

	const props = defineProps({
        mode: ''
    })

	const emit = defineEmits(['createConnection'])

	async function createProcess(process) {
		// we must send ELG "params" 
		// target
		state.error = ''
console.log(store.current().data.id)
console.log(store.process_id)
console.log(store.process)
console.log(state.out_params)

		var process = {id: store.process.id}
		process.params = state.out_params
		var res = await web.createFileProcess(process, store.current().data.id)
		//var node = res.data.result[0]

	}

	function close() {
		store.new_node_type = ''
		store.new_node_relation = null
		store.process_creator_open = false
	}

	onActivated(async()=> {
		console.log('onmounted')
		for(var param in store.process.params_help) {
			state.out_params[param] = store.process.params_help[param].default
		}
	})

</script>
