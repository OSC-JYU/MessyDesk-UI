<template>

	<!-- Modal -->
	<div v-if="store.exporter_open" class="modal modal-lg fade show" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true" style="display:block">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<h4 class="modal-title" id="exampleModalLabel">
						Export {{store.exporter_open}}
					</h4>

				</div>

				<div class="modal-body">
Not implemented yet!


				</div>

				<div class="modal-footer">
					<b>{{state.current_file}}</b>
					<button @click="close()" type="button" class="btn btn-secondary" >Cancel</button>


					<div v-if="state.status" class="alert alert-info">{{state.status}}</div>
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
		files:[],
		current_file: '',
		status: '',
		error: ''
	})
	var new_node = reactive({})
    var created = reactive([])

	const props = defineProps({
        mode: ''
    })

	watch(
      () => store.exporter_open,
      async (newValue, oldValue) => {
		  console.log(newValue)
        //if(newValue) getFiles()
    })


	const emit = defineEmits(['createConnection'])

	async function getFiles() {
		state.files = await web.getFiles(store.importer_open)
	}



	function close() {
		store.exporter_open = false
		state.current_file = ''
		state.status = ''
	}

	onMounted(async()=> {
		state.schemas = await web.getSchemas()
	})

</script>
