<script setup>
import { computed, reactive, watch } from 'vue'
import { createSource } from '@/api/projects.js'
import FormDialog from '@/ui/FormDialog.vue'
import { useWorkspace } from '../useWorkspace.js'

// Adds an outside source (a shared Nextcloud folder or a DSpace 7 server)
// to the desk. Creating it does not import anything yet.
const workspace = useWorkspace()
const dialog = workspace.state.dialogs.createSource
const form = reactive({ name: '', url: '', description: '', pending: false, error: null })

const TYPES = {
  nextcloud: {
    title: 'Add a Nextcloud source',
    urlLabel: 'Nextcloud URL (full link to your shared folder)',
    example: 'https://nextcloud.jyu.fi/index.php/s/nGwmKcP3wy8pHJx',
  },
  dspace7: {
    title: 'Add a DSpace 7 source',
    urlLabel: 'DSpace 7 REST API URL',
    example: 'https://demo.dspace.org/server/api/discover/search',
  },
}
const type = computed(
  () => TYPES[dialog.type] || { title: 'Add a source', urlLabel: 'URL', example: '' },
)

watch(
  () => dialog.open,
  (open) =>
    open &&
    Object.assign(form, { name: '', url: '', description: '', pending: false, error: null }),
)

async function submit() {
  if (!form.name.trim() || !form.url.trim()) {
    form.error = 'Give the source a name and a URL.'
    return
  }
  form.pending = true
  try {
    const created = await createSource(
      workspace.state.deskRid,
      { source_name: form.name.trim(), url: form.url.trim(), description: form.description },
      dialog.type,
    )
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
    :title="type.title"
    submit-text="Add source"
    :pending="form.pending"
    :error="form.error"
    @submit="submit"
  >
    <v-text-field
      v-model="form.name"
      label="Source name"
      variant="outlined"
      density="comfortable"
      autofocus
    />
    <v-text-field
      v-model="form.url"
      :label="type.urlLabel"
      variant="outlined"
      density="comfortable"
    />
    <p v-if="type.example" class="source-dialog__hint">
      For testing you can use {{ type.example }}
    </p>
    <v-textarea
      v-model="form.description"
      label="Description of your data"
      variant="outlined"
      rows="2"
      auto-grow
    />
    <p class="source-dialog__hint">Adding a source does not import any data yet.</p>
  </FormDialog>
</template>

<style scoped>
.source-dialog__hint {
  margin: 0 0 var(--md-space-3);
  font-size: var(--md-font-size-xs);
  color: var(--md-color-text-muted);
  word-break: break-all;
}
</style>
