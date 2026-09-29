<script setup>
import { computed, reactive, watch } from 'vue'
import { deleteNode } from '@/api/projects.js'
import ConfirmDialog from '@/ui/ConfirmDialog.vue'
import { useWorkspace } from '../useWorkspace.js'

// Deleting a node also deletes everything made from it.
const workspace = useWorkspace()
const dialog = workspace.state.dialogs.deleteNode
const state = reactive({ pending: false, error: '' })

const name = computed(() => {
  const node = dialog.node
  const label = node?.data?.label || node?.data?.name || ''
  return node?.type ? `“${label}” (${node.data?.type || node.type})` : `“${label}”`
})

watch(
  () => dialog.open,
  (open) => open && Object.assign(state, { pending: false, error: '' }),
)

async function confirm() {
  state.pending = true
  state.error = ''
  try {
    await deleteNode(dialog.node.data?.process_rid || dialog.node.id)
    dialog.open = false
    workspace.select(null)
    workspace.reload()
  } catch (error) {
    state.error = error?.message || 'Deleting failed.'
  } finally {
    state.pending = false
  }
}
</script>

<template>
  <ConfirmDialog
    v-model="dialog.open"
    title="Delete node"
    :message="`Delete ${name}? This also deletes all of its child nodes.`"
    confirm-text="Delete"
    danger
    :loading="state.pending"
    :error="state.error"
    @confirm="confirm"
  >
    <p v-if="state.pending" class="delete-node__note">
      Deleting can take a while for large node trees.
    </p>
  </ConfirmDialog>
</template>

<style scoped>
.delete-node__note {
  margin: var(--md-space-3) 0 0;
  color: var(--md-color-text-muted);
}
</style>
