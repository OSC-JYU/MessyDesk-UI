<script setup>
import { computed, reactive, watch } from 'vue'
import ConfirmDialog from '@/ui/ConfirmDialog.vue'

// Deleting a desk removes everything in it, so the name must be typed first.
const open = defineModel({ type: Boolean, default: false })

const props = defineProps({
  desk: { type: Object, default: null },
  remove: { type: Function, required: true },
})

const state = reactive({ typed: '', pending: false, error: '' })

watch(open, (isOpen) => {
  if (isOpen) Object.assign(state, { typed: '', pending: false, error: '' })
})

const matches = computed(() => state.typed.trim() === (props.desk?.name || '').trim())

async function confirm() {
  if (!matches.value) return
  state.pending = true
  state.error = ''
  try {
    await props.remove(props.desk.rid)
    open.value = false
  } catch (error) {
    state.error = error?.message || 'Could not delete the desk.'
  } finally {
    state.pending = false
  }
}
</script>

<template>
  <ConfirmDialog
    v-model="open"
    title="Delete desk"
    :message="`This deletes “${desk?.name}” with all its files, sets and processing results. It cannot be undone.`"
    confirm-text="Delete desk"
    danger
    :confirm-disabled="!matches"
    :loading="state.pending"
    :error="state.error"
    @confirm="confirm"
  >
    <v-text-field
      v-model="state.typed"
      :label="`Type the desk name to confirm`"
      :placeholder="desk?.name"
      variant="outlined"
      density="comfortable"
      hide-details
      class="mt-4"
      data-test="delete-desk-name"
      @keydown.enter.prevent="confirm"
    />
  </ConfirmDialog>
</template>
