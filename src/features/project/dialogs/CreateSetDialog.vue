<script setup>
import { reactive, watch } from 'vue'
import { createSet } from '@/api/projects.js'
import FormDialog from '@/ui/FormDialog.vue'
import { useWorkspace } from '../useWorkspace.js'

// Makes a new, empty set on the desk.
const workspace = useWorkspace()
const dialog = workspace.state.dialogs.createSet
const form = reactive({ name: '', description: '', pending: false, error: null })

watch(
  () => dialog.open,
  (open) => open && Object.assign(form, { name: '', description: '', pending: false, error: null }),
)

async function submit() {
  if (!form.name.trim()) {
    form.error = 'Give the set a name.'
    return
  }
  form.pending = true
  try {
    const created = await createSet(workspace.state.deskRid, form.name.trim(), form.description)
    dialog.open = false
    workspace.reload(created?.['@rid'] || null)
  } catch (error) {
    form.error = error
  } finally {
    form.pending = false
  }
}
</script>

<template>
  <FormDialog
    v-model="dialog.open"
    title="Create set"
    submit-text="Create set"
    :pending="form.pending"
    :error="form.error"
    @submit="submit"
  >
    <v-text-field
      v-model="form.name"
      label="Set name"
      variant="outlined"
      density="comfortable"
      autofocus
    />
    <v-textarea
      v-model="form.description"
      label="Description"
      variant="outlined"
      rows="2"
      auto-grow
    />
  </FormDialog>
</template>
