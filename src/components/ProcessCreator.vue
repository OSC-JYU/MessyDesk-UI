<template>

	<!-- Modal -->
	<div v-if="store.process_creator_open" class="modal modal-lg fade show" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true" style="display:block">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
						Add Cruncher <img src="icons/cookie-bite-solid.svg"/>
				</div>


				
				<div class="modal-body">
					<h4 v-if="store.process"> {{ store.process.tasks[store.task_id].name}}</h4>
					
					<div style="margin-bottom:40px">{{ store.process.tasks[store.task_id].description }} </div>


					<div>
						<div v-if="store.process.tasks[store.task_id].params_help">
							<div v-for="(help, key) in store.process.tasks[store.task_id].params_help" :key="key" class="input-group mb-3">
								<div class="input-group-prepend">
									<span class="input-group-text" id="basic-addon1">{{ help.name }}</span>
								</div>
							

							

							
								
								
								<div >
									<input v-model="state.out_params[key]" type="text" class="form-control" placeholder=""  aria-label="Username" aria-describedby="basic-addon1">
									<div>{{ help.help }}</div>
									<div v-if="help.values"	>{{ help.values }}</div>	
								</div>
	

								
							</div>
							
						</div>
						
						<div v-else-if="store.process.params_help" >
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


				<div class="modal-footer">
					{{ store.current().data.name }}
					<v-btn @click="close()" class="btn btn-secondary" >Cancel</v-btn>
					<v-btn   
						class="text-none ms-4 text-white"
        				color="blue-darken-4"
        				rounded="0"
        				variant="elevated" 
						v-if="store.task_id " @click=createProcess() >Crunch!</v-btn>
					<img src="icons/cookie-bite-solid.svg"/>
					<div v-if="state.error" class="alert alert-danger">{{state.error}}</div>
				</div>

				<div class="card">
						<div class="card-header">This cruncher is provided by 
							<a v-if="store.process.source_url" :href="store.process.source_url" target="_blank"><b>{{ store.process.name }}</b></a>
							<b v-else>{{ store.process.name }}</b></div>
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
	const route = useRoute();


	var state = reactive({
		current_type: '',
		current_schema: null,
		out_params: {},
		user_info: '',
		error: ''
	})
	var new_node = reactive({})
    var created = reactive([])

	const props = defineProps({
        mode: ''
    })

    watch(
        () => store.process,
        async (newValue, oldValue) => {
            initForm()

    })

	async function createProcess() {
		// we must send ELG "params" 
		// target
		state.error = ''
console.log(store.current().id)
console.log(store.task_id)
console.log(store.process)
console.log(state.out_params)

		var process = {id: store.process.id, task: store.task_id}
		process.params = state.out_params
		process.params.task = store.task_id
		if(store.process.tasks[store.task_id].info) process.info = store.process.tasks[store.task_id].info

		if(store.process.tasks[store.task_id].info) {
			console.log('INFO LÖYTYI')
			process.info = createUserInfo(store.process.tasks[store.task_id].info, state.out_params)
		}
		console.log(process)
		var res = await web.createFileProcess(process, store.current().id)
		//var node = res.data.result[0]
		//console.log(res)
		//store.reload()
		close()

	}

	function close() {
		store.new_node_type = ''
		store.new_node_relation = null
		store.process_creator_open = false
		//router.push({ name: 'graph', query: { node: route.query.desk} })
	}

	function createUserInfo(info, params) {
		if(info) {
			console.log('params:')
			for(var key of Object.keys(params)) {
				console.log(key)
				info = info.replace('{{' + key + '}}', params[key])
			}
			return info
		} else {
			return JSON.stringify(params)
		}

	}

	function initForm() {
		state.out_params = {}
		// set default values
		if(store.process.tasks[store.task_id].params_help) {
			for(var param in store.process.tasks[store.task_id].params_help) {
				state.out_params[param] = store.process.tasks[store.task_id].params_help[param].default
			}	
		} else if(store.process.params_help) {
			for(var param in store.process.params_help) {
				state.out_params[param] = store.process.params_help[param].default
			}	
		}
	}


</script>
