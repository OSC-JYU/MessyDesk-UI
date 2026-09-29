<script setup>
// Vue Flow passes more props (id, label, position, …) than a node uses;
// they must not fall through onto the frame.
defineOptions({ inheritAttrs: false })
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import NodeShell from './NodeShell.vue'
import { versioned } from './thumbnails.js'

// A PDF: first-page thumbnail, page count and size. PDFs are split into
// pages by an importer, which connects from any side.
const props = defineProps({ data: { type: Object, required: true } })
const src = computed(() => versioned(props.data.image, props.data.thumbnail_version))
</script>

<template>
  <NodeShell :label="data.label" kind="error" icon="mdi-file-pdf-box">
    <img v-if="src" :key="src" :src="src" alt="" class="pdf-node__thumb" draggable="false" />
    <v-icon v-else icon="mdi-file-pdf-box" size="96" color="error" aria-hidden="true" />
    <pre v-if="data.description">{{ data.description }}</pre>
    <v-chip v-if="data.model" size="x-small" color="success" variant="outlined" label>{{
      data.model
    }}</v-chip>
    <p v-if="data.metadata" class="pdf-node__meta">
      {{ data.metadata.page_count || 'n/a' }} pages · {{ data.metadata.size }} MB
    </p>
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
.pdf-node__thumb {
  display: block;
  width: 100%;
}

.pdf-node__meta {
  margin: var(--md-space-2) 0 0;
  color: var(--md-color-text-muted);
}
</style>
