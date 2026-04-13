<template>
  <div v-if="isROISet" class="roi-tools">
    <div v-if="roiShapes.length" class="mb-2">
      <div class="text-caption text-medium-emphasis mb-1">{{ roiShapes.length }} region{{ roiShapes.length !== 1 ? 's' : '' }} defined</div>
      <v-chip
        v-for="(shape, i) in roiShapes"
        :key="i"
        size="x-small"
        variant="tonal"
        color="primary"
        class="mr-1 mb-1"
      >
        <v-icon start size="12">{{ shapeIcon(shape.type) }}</v-icon>
        {{ shape.label || `Region ${i + 1}` }}
      </v-chip>
    </div>
    <div v-else class="text-caption text-medium-emphasis mb-2">
      No regions defined yet.
    </div>

    <v-btn
      color="primary"
      variant="tonal"
      size="small"
      block
      prepend-icon="mdi-selection-drag"
      @click="openEditor"
    >
      Open ROI Editor
    </v-btn>
  </div>
</template>

<script setup>
import { computed, watch, ref } from 'vue'
import web from '../../web.js'
import { store } from '../Store.js'

const props = defineProps({
  file: { type: Object, default: null }
})

const roiShapes = ref([])

const isROISet = computed(() => {
  const node = store.current_node
  return node && (node.type === 'roi-set' || node.data?.type === 'roi-set')
})

function shapeIcon(type) {
  const icons = { rect: 'mdi-shape-rectangle-plus', circle: 'mdi-circle-outline', polygon: 'mdi-shape-polygon-plus' }
  return icons[type] || 'mdi-shape'
}

function openEditor() {
  store.filter_editor = store.current_node
}

watch(() => [props.file, isROISet.value], async () => {
  if (!isROISet.value || !props.file) { roiShapes.value = []; return }
  try {
    const setRid = store.current_node?.id || store.current_node?.['@rid']
    if (!setRid || !props.file['@rid']) { roiShapes.value = []; return }
    const response = await web.getImageROIs(props.file['@rid'], setRid)
    if (response && response.rois) {
      roiShapes.value = Array.isArray(response.rois) ? response.rois : []
    } else {
      roiShapes.value = []
    }
  } catch (e) {
    roiShapes.value = []
  }
}, { immediate: true })
</script>
