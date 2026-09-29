<script setup>
import { computed } from 'vue'
import NodeShell from './NodeShell.vue'

// Text and data files (text, csv, html, JSON results, OCR, NER, …).
const props = defineProps({ data: { type: Object, required: true } })

const LOOKS = {
  'human.json': { icon: 'mdi-face-man', note: 'Faces' },
  'ner.json': { icon: 'mdi-account-search-outline', note: 'Named entities' },
  'ocr.json': { icon: 'mdi-text-recognition', note: 'OCR' },
  'polygons.json': { icon: 'mdi-vector-polygon', note: 'Text lines' },
  'faiss.json': { icon: 'mdi-search-web', note: 'Search index' },
  'error.json': { icon: 'mdi-alert', note: 'Error' },
  html: { icon: 'mdi-language-html5' },
  csv: { icon: 'mdi-table' },
}

const look = computed(() => LOOKS[props.data.type] || {})
const isError = computed(() => props.data.type === 'error.json')
const showDescription = computed(
  () => props.data.description && props.data.description !== props.data.label,
)
</script>

<template>
  <NodeShell
    :label="data.label"
    :kind="isError ? 'error' : 'file'"
    :icon="look.icon || 'mdi-file-document-outline'"
    :crunchable="!isError"
  >
    <p v-if="look.note" class="file-node__note">
      <v-icon :icon="look.icon" size="28" aria-hidden="true" /> {{ look.note }}
    </p>
    <pre v-if="data.info">{{ data.info }}</pre>
    <pre v-if="showDescription" class="file-node__description">{{ data.description }}</pre>
    <div v-if="data.model || data.location" class="file-node__chips">
      <v-chip v-if="data.model" size="x-small" color="success" variant="flat" label>{{
        data.model
      }}</v-chip>
      <v-chip v-if="data.location" size="x-small" color="info" variant="flat" label>{{
        data.location
      }}</v-chip>
    </div>
  </NodeShell>
</template>

<style scoped>
.file-node__note {
  display: flex;
  align-items: center;
  gap: var(--md-space-2);
  margin: 0 0 var(--md-space-2);
  color: var(--md-color-teal);
  font-weight: var(--md-font-weight-medium);
}

.file-node__description {
  margin-block-start: var(--md-space-2) !important;
  padding: var(--md-space-2);
  border-radius: var(--md-radius-sm);
  background: var(--md-color-bg);
}

.file-node__chips {
  display: flex;
  gap: var(--md-space-1);
  margin-block-start: var(--md-space-2);
}
</style>
