<script setup>
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { fileUrl, previewUrl } from '../fileUrls.js'
import { rectBetween, toImagePixels } from '../imageEdit.js'
import ThumbnailImage from '@/ui/ThumbnailImage.vue'

// An image, with the rotation preview and the crop rectangle of the
// viewer's quick edits. The viewer reads the crop through the exposed
// getCropSelection().
const props = defineProps({
  file: { type: Object, required: true },
  rotation: { type: Number, default: 0 },
  cropMode: { type: Boolean, default: false },
  version: { type: Number, default: 0 },
})

const emit = defineEmits(['crop-selection-change'])

const image = ref(null)
const state = reactive({
  selection: null,
  anchor: null,
  original: { width: 0, height: 0 },
  failed: false,
})

const src = computed(() => previewUrl(props.file.path, props.version))
const selectionStyle = computed(() => {
  const s = state.selection
  return s
    ? { left: `${s.x}px`, top: `${s.y}px`, width: `${s.width}px`, height: `${s.height}px` }
    : {}
})

function pointIn(event) {
  const rect = image.value?.getBoundingClientRect()
  if (!rect?.width) return null
  return {
    x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
    y: Math.max(0, Math.min(rect.height, event.clientY - rect.top)),
  }
}

function onMove(event) {
  const point = pointIn(event)
  if (point && state.anchor) state.selection = rectBetween(state.anchor, point)
}

function onUp(event) {
  onMove(event)
  state.anchor = null
  stopListening()
  emit(
    'crop-selection-change',
    Boolean(state.selection?.width >= 1 && state.selection?.height >= 1),
  )
}

function stopListening() {
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('mouseup', onUp)
}

function onDown(event) {
  if (!props.cropMode || event.button !== 0) return
  const point = pointIn(event)
  if (!point) return
  state.anchor = point
  state.selection = { ...point, width: 0, height: 0 }
  emit('crop-selection-change', false)
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

function clearSelection() {
  state.selection = null
  state.anchor = null
  stopListening()
  emit('crop-selection-change', false)
}

// The preview may be smaller than the original, so the crop is mapped to
// the size of the original file.
function loadOriginalSize() {
  if (state.original.width) return
  const img = new Image()
  img.onload = () => (state.original = { width: img.naturalWidth, height: img.naturalHeight })
  img.src = fileUrl(props.file['@rid'])
}

watch(
  () => props.cropMode,
  (on) => (on ? loadOriginalSize() : clearSelection()),
)
watch(
  () => props.file['@rid'],
  () => {
    clearSelection()
    state.original = { width: 0, height: 0 }
    state.failed = false
  },
)
onUnmounted(stopListening)

defineExpose({
  getCropSelection() {
    const rect = image.value?.getBoundingClientRect()
    const natural = state.original.width
      ? state.original
      : { width: image.value?.naturalWidth || 0, height: image.value?.naturalHeight || 0 }
    return toImagePixels(
      state.selection,
      { width: rect?.width || 0, height: rect?.height || 0 },
      natural,
    )
  },
  clearCropSelection: clearSelection,
})
</script>

<template>
  <div class="image-display">
    <div
      v-if="file.path && !state.failed"
      class="image-display__stage"
      :class="{ 'image-display__stage--crop': cropMode }"
      @mousedown.prevent="onDown"
    >
      <img
        ref="image"
        :src="src"
        :alt="file.label || 'Image'"
        class="image-display__image"
        :style="{ transform: `rotate(${rotation}deg)` }"
        draggable="false"
        @error="state.failed = true"
      />
      <div v-if="state.selection" class="image-display__crop" :style="selectionStyle" />
    </div>
    <ThumbnailImage v-else :alt="file.label || 'Image'" class="image-display__missing" />
  </div>
</template>

<style scoped>
.image-display {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: var(--md-space-5);
  overflow: auto;
  background: var(--md-color-bg);
}

.image-display__stage {
  position: relative;
  display: inline-flex;
  user-select: none;
}

.image-display__stage--crop {
  cursor: crosshair;
}

.image-display__image {
  max-width: 100%;
  max-height: calc(100dvh - var(--md-header-height) * 3);
  object-fit: contain;
  border-radius: var(--md-radius-md);
  box-shadow: var(--md-shadow-2);
  transition: transform 0.2s ease;
}

.image-display__crop {
  position: absolute;
  border: 2px solid var(--md-color-primary);
  background: color-mix(in srgb, var(--md-color-primary) 18%, transparent);
  pointer-events: none;
}

.image-display__missing {
  max-width: var(--md-card-min-width);
  margin: var(--md-space-6) auto;
}
</style>
