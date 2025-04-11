<template>

	<!-- Modal -->
	<div class="modal show" tabindex="-1" style="display:block" v-if="store.project_deleter_open">
	  <div class="modal-dialog">
	    <div class="modal-content">
	      <div class="modal-header">
	        <h5 class="modal-title">Delete Desk</h5>
	      </div>
	      <div class="modal-body">
	        <p class="alert alert-info">Deleting a Desk deletes all data!</p>
	      </div>
	      <div class="modal-footer">
	        <button type="button" @click="store.project_deleter_open = false" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
	        <button type="button" @click="deleteDesk()" class="btn btn-danger"><b>Delete {{store.current().data.name}}</b> </button>
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
		error: ''
	})


	const props = defineProps({
        mode: ''
    })

	async function deleteDesk() {
		state.error = ''
		var response = await web.deleteProject(store.current().id)
		store.current_node = null
		store.reload(null)
		store.project_deleter_open = false
	}


</script>
