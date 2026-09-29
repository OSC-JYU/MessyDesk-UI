<script setup>
import { onMounted, ref } from 'vue'
import { getProjects } from '@/api/projects.js'

// Picks the desks a search or tag view is limited to. None picked means all.
const selected = defineModel({ type: Array, default: () => [] })

defineProps({
  label: { type: String, default: 'Desks' },
  hint: { type: String, default: 'None selected: all your desks.' },
})

const desks = ref([])

onMounted(async () => {
  try {
    desks.value = (await getProjects()).map((p) => ({
      value: p['@rid'],
      title: p.label || p['@rid'],
    }))
  } catch {
    desks.value = []
  }
})
</script>

<template>
  <v-autocomplete
    v-model="selected"
    :items="desks"
    :label="label"
    :hint="hint"
    persistent-hint
    multiple
    chips
    closable-chips
    clearable
    variant="outlined"
    density="comfortable"
    prepend-inner-icon="mdi-desk"
  />
</template>
