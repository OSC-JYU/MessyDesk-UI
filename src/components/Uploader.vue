<template>

	<!-- Modal -->
	<div v-if="store.uploader_open && route.query.node" class="modal modal-lg fade show" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true" style="display:block">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
						Upload File 
				</div>

				<div class="modal-body">

                    <div class="mb-3">
                      <label for="formFile" class="form-label">Add file to project</label>
                      <input class="form-control" type="file" id="image" ref="upload">
                    </div>

                    <button @click="sendFile()" class="btn btn-primary">send file</button>
				
				</div>

                <div class="modal-footer">
					<button @click="close()" type="button" class="btn btn-secondary" >Cancel</button>
					
					<div v-if="state.error" class="alert alert-danger">{{state.error}}</div>
				</div>

            </div>
		</div>
	</div>

</template>


<script setup>
    import { watch, reactive, ref} from "vue";
	import { useRoute } from 'vue-router'
    import {store} from "./Store.js";
    import web from "../web.js";

	const route = useRoute();
    const upload = ref(null);


	var state = reactive({
		error: ''
	})
	var new_node = reactive({})
    var created = reactive([])

	const props = defineProps({
        mode: ''
    })


    async function sendFile() {
        if(upload.value.files.length && route.query.node) {
            try {
                await web.uploadFile(upload.value.files[0], route.query.node)
                store.uploader_open = false
                store.reload()
            } catch(e) {
                if(e.response && e.response.data.error)
                    alert(e.response.data.error)
                else
                    alert(e)
            }
        }
    }

	function close() {

		store.uploader_open = false
	}




</script>
