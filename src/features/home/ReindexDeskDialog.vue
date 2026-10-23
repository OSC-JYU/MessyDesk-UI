<script setup>
import { reactive, watch } from 'vue'
import ConfirmDialog from '@/ui/ConfirmDialog.vue'

const open = defineModel({ type: Boolean, default: false })

const props = defineProps({
  desk: { type: Object, default: null },
  reindex: { type: Function, required: true },
})

const state = reactive({ pending: false, error: '', result: null })

watch(open, (isOpen) => {
  if (isOpen) Object.assign(state, { pending: false, error: '', result: null })
})

async function start() {
  if (state.result) {
    open.value = false
    return
  }
  state.pending = true
  state.error = ''
  try {
    state.result = await props.reindex(props.desk.rid)
  } catch (error) {
    state.error = error?.message || 'Could not start re-indexing.'
  } finally {
    state.pending = false
  }
}
</script>

<template>
  <ConfirmDialog
    v-model="open"
    title="Re-index search"
    :message="`Re-indexing clears the search data of “${desk?.name}” and rebuilds it from the files already indexed.`"
    :confirm-text="state.result ? 'Close' : 'Re-index'"
    :cancel-text="state.result ? 'Close' : 'Cancel'"
    :loading="state.pending"
    :error="state.error"
    @confirm="start"
  >
    <v-alert v-if="state.result" type="success" variant="tonal" density="compact" class="mt-3">
      Re-index queued: {{ state.result.source_sets_found || 0 }} source sets,
      {{ state.result.requeued_sets || 0 }} sets and {{ state.result.requeued_files || 0 }} files.
    </v-alert>
  </ConfirmDialog>
</template>
