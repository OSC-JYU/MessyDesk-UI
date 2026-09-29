<script setup>
import { computed } from 'vue'
import NodeShell from './NodeShell.vue'

// A set of files: file count, a preview grid (thumbnails, PDF icons or text
// samples), and the cruncher once it has files and is not being filled.
const props = defineProps({ data: { type: Object, required: true } })

const running = computed(() => props.data.status === 'running')
const count = computed(() => Number(props.data.count || 0))
const label = computed(
  () => `${props.data.label} (${count.value ? `${count.value} files` : 'empty'})`,
)
</script>

<template>
  <NodeShell
    :label="label"
    kind="set"
    :icon="running ? 'mdi-run' : 'mdi-folder-outline'"
    :crunchable="count > 0 && !running"
    wide
  >
    <div v-if="data.paths?.length" class="set-node__grid">
      <template v-for="(path, index) in data.paths" :key="`${index}-${path}`">
        <v-icon
          v-if="path === '__pdf_icon__'"
          icon="mdi-file-pdf-box"
          size="46"
          color="error"
          aria-hidden="true"
        />
        <img v-else :src="path" alt="" draggable="false" />
      </template>
    </div>
    <div v-else-if="data.text_samples?.length" class="set-node__samples">
      <div v-for="(sample, index) in data.text_samples" :key="index" class="set-node__sample">
        <strong v-if="sample.label">{{ sample.label }}</strong>
        <p>{{ sample.text }}</p>
      </div>
    </div>
    <v-icon
      v-else-if="count"
      icon="mdi-text-box-multiple-outline"
      size="55"
      class="ma-4"
      aria-hidden="true"
    />
    <pre v-if="data.description" class="mt-2">{{ data.description }}</pre>
  </NodeShell>
</template>

<style scoped>
.set-node__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--md-space-2);
  align-items: center;
  justify-items: center;
}

.set-node__grid img {
  max-width: 100%;
  border-radius: var(--md-radius-sm);
}

.set-node__samples {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-2);
}

.set-node__sample {
  max-height: calc(var(--md-space-7) * 3);
  overflow: hidden;
  padding: var(--md-space-2);
  border: 1px solid var(--md-color-border);
  border-radius: var(--md-radius-md);
  background: var(--md-color-bg);
}

.set-node__sample p {
  margin: var(--md-space-1) 0 0;
  white-space: pre-wrap;
}
</style>
