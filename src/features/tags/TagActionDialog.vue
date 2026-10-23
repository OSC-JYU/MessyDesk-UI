<script setup>
import { computed } from 'vue'
import ConfirmDialog from '@/ui/ConfirmDialog.vue'
import { actionText } from './tagAdmin.js'

// Confirmation of renaming, removing from the desk or deleting a tag. The warning is built
// from the tag's usage, which `action` (useTagAction) has loaded.
const props = defineProps({
  action: { type: Object, required: true },
  deskRid: { type: String, default: '' },
})

const state = props.action.state
const text = computed(() => actionText(state.action, state.tag, state.usage, props.deskRid))
const error = computed(() => {
  if (!state.error) return ''
  const message = state.error.message || 'Something went wrong.'
  return state.conflict ? `That name is already in use. ${message}` : message
})
const disabled = computed(
  () =>
    state.loading ||
    !state.usage ||
    (state.action === 'rename' && (!state.label.trim() || props.action.unchanged())),
)
</script>

<template>
  <ConfirmDialog
    v-model="state.open"
    :title="text.title"
    :confirm-text="text.confirmText"
    :danger="text.danger"
    :loading="state.pending"
    :confirm-disabled="disabled"
    :error="error"
    @confirm="action.confirm"
  >
    <v-progress-linear v-if="state.loading" indeterminate class="mb-3" />
    <template v-else-if="state.usage">
      <p v-for="line in text.lines" :key="line" class="tag-action__line">{{ line }}</p>
    </template>
    <v-text-field
      v-if="state.action === 'rename'"
      v-model="state.label"
      label="New name"
      variant="outlined"
      density="comfortable"
      autofocus
      hide-details="auto"
      class="mt-3"
      @keyup.enter="action.confirm"
    />
  </ConfirmDialog>
</template>

<style scoped>
.tag-action__line {
  margin: 0 0 var(--md-space-2);
}
</style>
