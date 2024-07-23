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
	      </div>
	      <div class="modal-footer">
	        <button type="button" @click="store.node_deleter_open = false" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
	        <button type="button" @click="deleteNode()" class="btn btn-danger"><b>Delete {{store.current().data.name}}</b> ({{store.current().type}})</button>
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

	async function deleteNode() {
		state.error = ''
		var response = await web.deleteNode(store.current().id)
		store.current_node = null
		store.reload(null)
		store.node_deleter_open = false
	}


</script>
