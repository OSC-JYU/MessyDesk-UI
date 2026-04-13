<template>

	<!-- Modal -->
	<div class="modal show" tabindex="-1" style="display:block" v-if="store.node_deleter_open">
	  <div class="modal-dialog">
	    <div class="modal-content">
	      <div class="modal-header">
	        <h5 class="modal-title">Delete Node</h5>
	      </div>
	      <div class="modal-body">
	        <p class="alert alert-info">Deleting a node deletes also all children nodes!</p>
			<div v-if="state.deleting" class="alert alert-warning d-flex align-items-center" role="alert">
				<div class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>
				<div>
					Deleting is in progress. This may take a while for large node trees. Please wait.
				</div>
			</div>
			<p v-if="state.error" class="alert alert-danger">{{ state.error }}</p>
	      </div>
	      <div class="modal-footer">
	        <button type="button" @click="store.node_deleter_open = false" class="btn btn-secondary" data-bs-dismiss="modal" :disabled="state.deleting">Close</button>
	        <button type="button" @click="deleteNode()" class="btn btn-danger" :disabled="state.deleting">
				<span v-if="!state.deleting"><b>Delete {{store.current().data.name}}</b> ({{store.current().type}})</span>
				<span v-else>Deleting...</span>
			</button>
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
		error: '',
		deleting: false,
	})


	const props = defineProps({
        mode: ''
    })

	async function deleteNode() {
		if(state.deleting) return
		state.error = ''
		state.deleting = true
		try {
			await web.deleteNode(store.current().data.process_rid || store.current().id)
			store.current_node = null
			store.reload(null)
			store.node_deleter_open = false
		} catch (error) {
			state.error = error?.message || 'Deleting node failed'
		} finally {
			state.deleting = false
		}
	}


</script>
