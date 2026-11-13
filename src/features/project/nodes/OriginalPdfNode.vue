<script setup>
// Vue Flow passes more props (id, label, position, …) than a node uses;
// they must not fall through onto the frame.
defineOptions({ inheritAttrs: false })
import { Handle, Position } from '@vue-flow/core'
import NodeShell from './NodeShell.vue'

// An uploaded PDF that is not split yet. Only splitting it into pages is
// offered; the page crunchers (Poppler …) work on the pages.
defineProps({ data: { type: Object, required: true } })
</script>

<template>
  <NodeShell
    :label="data.label"
    kind="error"
    icon="mdi-file-pdf-box"
    :crunchable="!data._file_removed"
  >
    <div :class="{ 'original-pdf--removed': data._file_removed }">
      <v-icon
        :icon="data._file_removed ? 'mdi-file-remove-outline' : 'mdi-file-pdf-box'"
        size="96"
        :color="data._file_removed ? undefined : 'error'"
        aria-hidden="true"
      />
    </div>
    <p class="original-pdf__note">
      <v-chip v-if="data._file_removed" size="x-small" color="warning" variant="flat" label
        >File deleted</v-chip
      >
      <v-chip v-else size="x-small" color="error" variant="outlined" label>Original PDF</v-chip>
    </p>
    <p v-if="data._file_removed" class="original-pdf__meta">
      Deleted after splitting. The pages are in the set made from it.
    </p>
    <p v-else class="original-pdf__meta">Split it into pages to process the content.</p>
    <p v-if="data.metadata?.size" class="original-pdf__meta">{{ data.metadata.size }} MB</p>
    <template #handles>
      <Handle
        id="r"
        type="target"
        :position="Position.Right"
        :connectable="false"
        :connectable-start="false"
        :connectable-end="false"
      />
      <Handle
        id="t"
        type="source"
        :position="Position.Top"
        :connectable="false"
        :connectable-start="false"
        :connectable-end="false"
      />
      <Handle
        id="l"
        type="source"
        :position="Position.Left"
        :connectable="false"
        :connectable-start="false"
        :connectable-end="false"
      />
    </template>
  </NodeShell>
</template>

<style scoped>
.original-pdf--removed {
  opacity: 0.45;
}

.original-pdf__note {
  margin: var(--md-space-2) 0 0;
}

.original-pdf__meta {
  margin: var(--md-space-2) 0 0;
  color: var(--md-color-text-muted);
}
</style>
