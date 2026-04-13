<template>
  <div v-if="context && context.mode === 'search'" class="search-tools d-flex align-center pa-2">
    <v-chip color="indigo-darken-1" variant="flat" size="small" class="mr-3">
      <v-icon start size="small">mdi-magnify</v-icon>
      "{{ context.query }}"
    </v-chip>

    <div class="d-flex align-center">
      <v-btn @click="prev" :disabled="context.index <= 0" color="secondary" size="x-small">
        <v-icon size="small">mdi-chevron-left</v-icon>
      </v-btn>
      <span class="mx-2 text-caption">{{ context.index + 1 }} / {{ context.results.length }}</span>
      <v-btn @click="next" :disabled="context.index >= context.results.length - 1" color="secondary" size="x-small">
        <v-icon size="small">mdi-chevron-right</v-icon>
      </v-btn>
    </div>

    <v-spacer />

    <v-btn color="indigo" variant="tonal" size="x-small" @click="$emit('back-to-results')">
      <v-icon start size="small">mdi-arrow-left</v-icon>
      Back to results
    </v-btn>

    <v-btn icon size="x-small" variant="text" class="ml-2" @click="$emit('close')">
      <v-icon>mdi-close</v-icon>
    </v-btn>
  </div>
</template>

<script setup>
import web from '../../web.js'
import { store } from '../Store.js'

const props = defineProps({
  context: { type: Object, default: null }
})

const emit = defineEmits(['file-changed', 'back-to-results', 'close'])

async function prev() {
  if (!props.context || props.context.index <= 0) return
  props.context.index--
  await loadResult()
}

async function next() {
  if (!props.context || props.context.index >= props.context.results.length - 1) return
  props.context.index++
  await loadResult()
}

async function loadResult() {
  const result = props.context.results[props.context.index]
  if (!result) return
  const file = await web.getDocInfo(result.rid)
  store.file = file
  emit('file-changed', file)
}
</script>

<style scoped>
.search-tools {
  background: rgba(63, 81, 181, 0.08);
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  min-height: 48px;
}
</style>
