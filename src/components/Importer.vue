<template>

	<!-- Modal -->
	<div v-if="store.importer_open" class="modal modal-lg fade show" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true" style="display:block">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<h4 class="modal-title" id="exampleModalLabel">
						Import {{store.importer_open}}
					</h4>

				</div>

				<div class="modal-body">
					<ul v-for="file in state.files" :key="file">
						<li class="dropdown-item pointer" @click="state.current_file = file">{{file}}</li>
					</ul>
					<div  >
					<div class="mb-3">
						<label for="formFile" class="form-label"></label>
						<input class="form-control" type="file" id="upload" ref="file_upload">
						</div>

						<button @click="uploadFile()" class="btn btn-primary">send file</button>
					</div>
				</div>

  

				<div class="modal-footer">
					<b>{{state.current_file}}</b>
					<button @click="close()" type="button" class="btn btn-secondary" >Cancel</button>
					<template v-if="state.current_file">

						<button    @click="importFile()" type="button" class="btn btn-warning">Merge</button>
						<button @click="importFile('clear')" type="button" class="btn btn-danger">DELETE ALL and import</button>

					</template>

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
	const file_upload = ref(null);


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
      () => store.importer_open,
      async (newValue, oldValue) => {
        if(newValue) getFiles()
    })


	const emit = defineEmits(['createConnection'])

	async function getFiles() {
		state.files = await web.getFiles(store.importer_open)
	}

	async function importFile(mode) {
		try {
			if(state.current_file) {
				var file = state.current_file
				state.current_file = ''
				state.status = 'importing...'
				await web.importFile(store.importer_open, file, mode)
				close()
			}
		} catch(e) {
			alert(e)
		}
		//store.reload()
	}


    async function uploadFile() {
        if(file_upload.value.files.length) {
            try {
				console.log(store.importer_open)
                await web.uploadFile(file_upload.value.files[0], store.importer_open)
				state.files = await web.getFiles(store.importer_open)
				file_upload.value = null

            } catch(e) {
                if(e.response && e.response.data.error)
                    alert(e.response.data.error)
                else
                    alert(e)
            }
        }
    }

	function close() {
		store.importer_open = false
		state.current_file = ''
		state.status = ''
	}

	onMounted(async()=> {
		state.schemas = await web.getSchemas()
	})

</script>
