<script setup>
import { computed } from 'vue'
import CruncherPicker from '@/features/services/crunchers/CruncherPicker.vue'
import { useWorkspace } from '../useWorkspace.js'

// The crunchers that can process the chosen node.
const workspace = useWorkspace()
const dialog = workspace.state.dialogs.crunchers
// Sources run on the source endpoint; other nodes by their file type.
const nodeType = computed(() => {
  const data = dialog.node?.data || {}
  return data._type === 'source' ? 'source' : data.type || dialog.node?.type
})
const title = computed(
  () =>
    `Crunchers for ${dialog.node?.data?.label || dialog.node?.type || ''}${dialog.filter === 'ROI' ? ' (regions)' : ''}`,
)

function done({ reload }) {
  dialog.open = false
  if (reload) workspace.reload()
}
</script>

<template>
  <v-dialog v-model="dialog.open" max-width="1100" scrollable>
    <v-card rounded="lg">
      <v-toolbar color="surface" density="comfortable" class="border-b">
        <v-toolbar-title>{{ title }}</v-toolbar-title>
        <v-btn icon="mdi-close" aria-label="Close" @click="dialog.open = false" />
      </v-toolbar>
      <v-card-text class="pa-0">
        <CruncherPicker
          v-if="dialog.open"
          :node="{ id: dialog.node?.id, type: nodeType }"
          :cruncher-filter="dialog.filter"
          @done="done"
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
