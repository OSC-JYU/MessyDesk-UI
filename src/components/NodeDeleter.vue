<template>
	<ConfirmDialog
		v-model="store.node_deleter_open"
		title="Delete node"
		:message="`Delete ${nodeName}? This also deletes all of its child nodes.`"
		confirm-text="Delete"
		danger
		:loading="state.deleting"
		:error="state.error"
		@confirm="deleteNode"
		@cancel="state.error = ''"
	>
		<p v-if="state.deleting" class="deleting-note">
			Deleting can take a while for large node trees. Please wait.
		</p>
	</ConfirmDialog>
</template>


<script setup>
	import { computed, reactive } from "vue";
	import { store } from "./Store.js";
	import web from "../web.js";
	import ConfirmDialog from "../ui/ConfirmDialog.vue";

	var state = reactive({
		error: '',
		deleting: false,
	})

	defineProps({
		mode: ''
	})

	const nodeName = computed(() => {
		const node = store.current() || {}
		const name = node.data?.name || node.data?.label || ''
		return node.type ? `“${name}” (${node.type})` : `“${name}”`
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

<style scoped>
.deleting-note {
	margin: var(--md-space-3) 0 0;
	color: var(--md-color-text-muted);
}
</style>
