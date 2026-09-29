<script setup>
// Vue Flow passes more props (id, label, position, …) than a node uses;
// they must not fall through onto the frame.
defineOptions({ inheritAttrs: false })
import { computed } from 'vue'
import NodeShell from './NodeShell.vue'
import { versioned } from './thumbnails.js'

// An image: its thumbnail, size, and regions of interest with their own
// cruncher button.
const props = defineProps({ data: { type: Object, required: true } })
const src = computed(() => versioned(props.data.image, props.data.thumbnail_version))
</script>

<template>
  <NodeShell :label="data.label" kind="image" icon="mdi-image-outline" crunchable>
    <template #default="{ crunch }">
      <img v-if="src" :key="src" :src="src" alt="" class="image-node__thumb" draggable="false" />
      <pre v-if="data.description" class="image-node__description">{{ data.description }}</pre>
      <div v-if="data.metadata" class="image-node__meta">
        <span
          >{{ data.metadata.width }}×{{ data.metadata.height }} · {{ data.metadata.size }} MB</span
        >
        <template v-if="data.roi_count">
          <span class="image-node__rois"
            ><v-icon icon="mdi-selection" size="16" aria-hidden="true" /> {{ data.roi_count }}</span
          >
          <v-btn
            icon="mdi-cookie"
            size="x-small"
            variant="text"
            class="nodrag"
            title="Crunch the regions"
            aria-label="Crunch the regions"
            @click.stop="crunch('ROI')"
          />
        </template>
      </div>
    </template>
  </NodeShell>
</template>

<style scoped>
.image-node__thumb {
  display: block;
  width: 100%;
  border-radius: var(--md-radius-sm);
}

.image-node__description {
  margin-block-start: var(--md-space-2) !important;
}

.image-node__meta {
  display: flex;
  align-items: center;
  gap: var(--md-space-2);
  margin-block-start: var(--md-space-2);
  color: var(--md-color-text-muted);
}

.image-node__rois {
  display: inline-flex;
  align-items: center;
  margin-inline-start: auto;
}
</style>
