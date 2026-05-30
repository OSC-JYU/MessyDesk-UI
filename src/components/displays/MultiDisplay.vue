<template>
  <v-container fluid class="pa-0 multidisplay-container">
    <v-sheet class="main-content pa-4" ref="contentContainer">
      <!-- Header -->
      <div class="d-flex align-center justify-space-between mb-4">
        <h3 class="text-h6">{{ state.file ? state.file.label : 'Content' }}</h3>
      </div>
          
      <!-- JSON Content -->
      <div v-if="state.contentType === 'json'" class="json-content">
        <pre>{{ state.content }}</pre>
      </div>
          
      <!-- Text Content -->
      <div v-else-if="state.contentType === 'text'" class="text-content" v-html="state.content"></div>
          
      <!-- Image Content -->
      <div v-else-if="state.contentType === 'image'" class="image-content">
        <div
          v-if="state.file && state.file.path"
          ref="imageStage"
          class="image-stage"
          :class="{ 'crop-mode': cropMode }"
          @mousedown.prevent="onCropMouseDown"
          @dragstart.prevent
        >
          <img
            ref="imageElement"
            :src="thumbnailUrl(state.file.path)"
            class="main-image"
            :style="{ transform: `rotate(${previewRotation}deg)` }"
            alt="Main content image"
            @load="onImageLoad"
            draggable="false"
            @dragstart.prevent
          />
          <div
            v-if="cropDisplaySelection"
            class="crop-selection"
            :style="cropDisplayStyle"
          ></div>
        </div>
        <div v-else class="image-placeholder">
          <v-icon size="64" color="grey">mdi-image</v-icon>
          <p class="text-grey">Image not available</p>
        </div>
      </div>
          
      <!-- Default Content -->
      <div v-else class="default-content">
        <pre>{{ state.content }}</pre>
      </div>
    </v-sheet>
  </v-container>

</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import web from "../../web.js";
import {store} from "../../components/Store.js";

const apiUrl = import.meta.env.VITE_API_PATH
const contentContainer = ref(null)
const imageStage = ref(null)
const imageElement = ref(null)

const emit = defineEmits(['change-tab', 'crop-selection-change'])
const props = defineProps({
  tab: { type: [String, Number, Boolean, Object], default: null },
  imageRotation: { type: Number, default: 0 },
  thumbnailVersion: { type: Number, default: null },
  cropMode: { type: Boolean, default: false },
})

const previewRotation = computed(() => {
  return Number.isFinite(Number(props.imageRotation)) ? Number(props.imageRotation) : 0
})

watch(() => props.tab, async () => {
  await load()
})

watch(() => props.cropMode, (enabled) => {
  if (enabled) {
    ensureOriginalImageDimensions()
  } else {
    clearImageCropSelection()
  }
})

// Also reload when store.file changes (e.g. from wrapper navigation)
watch(() => store.file, async (newFile) => {
  if (newFile) await load()
})

var state = reactive({
  file: null,
  content: '',
  contentType: 'text',
  thumbnailVersion: Date.now(),
  cropDisplaySelection: null,
  cropAnchorPoint: null,
  cropDragging: false,
  naturalImageWidth: 0,
  naturalImageHeight: 0,
  originalImageWidth: 0,
  originalImageHeight: 0,
})

const cropMode = computed(() => Boolean(props.cropMode) && state.contentType === 'image')

const cropDisplaySelection = computed(() => state.cropDisplaySelection)

const cropDisplayStyle = computed(() => {
  if (!state.cropDisplaySelection) return {}
  return {
    left: `${state.cropDisplaySelection.x}px`,
    top: `${state.cropDisplaySelection.y}px`,
    width: `${state.cropDisplaySelection.width}px`,
    height: `${state.cropDisplaySelection.height}px`,
  }
})

function thumbnailUrl(filePath) {
  if(!filePath) return ''
  const version = props.thumbnailVersion || state.thumbnailVersion
  return `${apiUrl}/api/thumbnails/${filePath}?v=${version}`
}

function determineContentType(content) {
  if (state.file && (state.file.type === 'image' || state.file['@type'] === 'Image')) {
    state.contentType = 'image'
    state.content = content
    return
  }
  
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content)
      state.contentType = 'json'
      state.content = JSON.stringify(parsed, null, 2)
    } catch (e) {
      state.contentType = 'text'
      state.content = replaceWithBr(content)
    }
  } else if (typeof content === 'object') {
    state.contentType = 'json'
    state.content = JSON.stringify(content, null, 2)
  } else {
    state.contentType = 'text'
    state.content = String(content)
  }
}

function replaceWithBr(text) {
  if(typeof text == 'string') {
    return text.replace(/\n/g, "<br />")
  } else {
    return text
  }
}

async function load() {
  state.file = null
  clearImageCropSelection()
  state.originalImageWidth = 0
  state.originalImageHeight = 0

  try {
    var f = await web.getNodeFile(store.file['@rid'])
    state.file = store.file
    determineContentType(f)
    state.thumbnailVersion = Date.now()
  } catch (error) {
    console.error('Error loading content:', error)
  }
}

onMounted(async() => {
  await load()
})

async function ensureOriginalImageDimensions() {
  if (!store.file?.['@rid']) return
  if (state.originalImageWidth > 0 && state.originalImageHeight > 0) return

  const rid = String(store.file['@rid']).replace('#', '')
  const src = `${apiUrl}/api/files/${rid}?v=${props.thumbnailVersion || state.thumbnailVersion}`

  await new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      state.originalImageWidth = Number(img.naturalWidth || 0)
      state.originalImageHeight = Number(img.naturalHeight || 0)
      resolve()
    }
    img.onerror = () => resolve()
    img.src = src
  })
}

function getMousePositionInImage(event) {
  const img = imageElement.value
  if (!img) return null
  const rect = img.getBoundingClientRect()
  if (!rect.width || !rect.height) return null

  const clampedX = Math.max(0, Math.min(rect.width, event.clientX - rect.left))
  const clampedY = Math.max(0, Math.min(rect.height, event.clientY - rect.top))
  return { x: clampedX, y: clampedY }
}

function normalizeDisplayRect(start, end) {
  const x = Math.min(start.x, end.x)
  const y = Math.min(start.y, end.y)
  const width = Math.abs(end.x - start.x)
  const height = Math.abs(end.y - start.y)
  return { x, y, width, height }
}

function onCropMouseDown(event) {
  if (!cropMode.value || event.button !== 0) return
  const point = getMousePositionInImage(event)
  if (!point) return

  state.cropAnchorPoint = point
  state.cropDisplaySelection = { x: point.x, y: point.y, width: 0, height: 0 }
  state.cropDragging = true
  emit('crop-selection-change', false)

  window.addEventListener('mousemove', onCropMouseMove)
  window.addEventListener('mouseup', onCropMouseUp)
}

function onCropMouseMove(event) {
  if (!state.cropDragging || !state.cropAnchorPoint) return
  const point = getMousePositionInImage(event)
  if (!point) return
  state.cropDisplaySelection = normalizeDisplayRect(state.cropAnchorPoint, point)
}

function onCropMouseUp(event) {
  if (!state.cropDragging) return
  state.cropDragging = false

  const point = getMousePositionInImage(event)
  if (point && state.cropAnchorPoint) {
    state.cropDisplaySelection = normalizeDisplayRect(state.cropAnchorPoint, point)
  }

  state.cropAnchorPoint = null
  window.removeEventListener('mousemove', onCropMouseMove)
  window.removeEventListener('mouseup', onCropMouseUp)

  const selection = state.cropDisplaySelection
  const hasSelection = Boolean(selection && selection.width >= 1 && selection.height >= 1)
  emit('crop-selection-change', hasSelection)
}

function onImageLoad(event) {
  const img = event?.target
  if (!img) return
  state.naturalImageWidth = Number(img.naturalWidth || 0)
  state.naturalImageHeight = Number(img.naturalHeight || 0)
}

function clearImageCropSelection() {
  state.cropDragging = false
  state.cropAnchorPoint = null
  state.cropDisplaySelection = null
  window.removeEventListener('mousemove', onCropMouseMove)
  window.removeEventListener('mouseup', onCropMouseUp)
  emit('crop-selection-change', false)
}

function getImageCropSelection() {
  const selection = state.cropDisplaySelection
  const img = imageElement.value
  if (!selection || !img) return null

  const rect = img.getBoundingClientRect()
  const displayWidth = Number(rect.width || 0)
  const displayHeight = Number(rect.height || 0)
  const naturalWidth = Number(state.originalImageWidth || state.naturalImageWidth || img.naturalWidth || 0)
  const naturalHeight = Number(state.originalImageHeight || state.naturalImageHeight || img.naturalHeight || 0)

  if (!displayWidth || !displayHeight || !naturalWidth || !naturalHeight) return null

  const scaleX = naturalWidth / displayWidth
  const scaleY = naturalHeight / displayHeight

  const crop = {
    x: Math.max(0, Math.round(selection.x * scaleX)),
    y: Math.max(0, Math.round(selection.y * scaleY)),
    width: Math.max(1, Math.round(selection.width * scaleX)),
    height: Math.max(1, Math.round(selection.height * scaleY)),
  }

  if (crop.x + crop.width > naturalWidth) {
    crop.width = Math.max(1, naturalWidth - crop.x)
  }
  if (crop.y + crop.height > naturalHeight) {
    crop.height = Math.max(1, naturalHeight - crop.y)
  }

  return crop
}

defineExpose({
  getImageCropSelection,
  clearImageCropSelection,
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onCropMouseMove)
  window.removeEventListener('mouseup', onCropMouseUp)
})
</script>

<style scoped>
.multidisplay-container {
  max-width: 100% !important;
}

.main-content {
  background-color: white;
  min-height: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.json-content pre {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #333;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  overflow-x: auto;
}

.text-content {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}

.image-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.image-stage {
  position: relative;
  display: inline-flex;
  user-select: none;
  -webkit-user-select: none;
}

.image-stage.crop-mode {
  cursor: crosshair;
}

.main-image {
  max-width: 100%;
  max-height: calc(100vh - 200px);
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  user-select: none;
  -webkit-user-select: none;
  -webkit-user-drag: none;
}

.crop-selection {
  position: absolute;
  border: 2px solid #1976d2;
  background: rgba(25, 118, 210, 0.18);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.5);
  pointer-events: none;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #666;
}

.image-placeholder p {
  margin-top: 16px;
  font-size: 14px;
}

.default-content pre {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #666;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  overflow-x: auto;
}
</style>
