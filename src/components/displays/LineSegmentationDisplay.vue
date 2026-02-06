<template>
  <v-container fluid class="pa-0 line-segmentation-display">
    <v-btn
      class="ma-2"
      color="primary"
      icon="mdi-close"
      style="position: absolute; top: 0; left: -60px; z-index: 1000"
      @click="$emit('change-tab', store.tab)"
    ></v-btn>

    <v-row no-gutters class="fill-height">
      <!-- Image and overlay -->
      <v-col cols="8" class="image-column">
        <v-sheet class="d-flex flex-column fill-height pa-4">
          <div class="image-wrapper" ref="imageWrapper">
            <div
              v-if="loading"
              class="d-flex align-center justify-center placeholder"
            >
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>

            <div
              v-else-if="!sourceImageUrl"
              class="d-flex align-center justify-center placeholder text-medium-emphasis"
            >
              No source image available
            </div>

            <div 
              v-else 
              class="image-stage"
              @wheel="handleImageWheel"
              @mousedown="startPanning"
              @mousemove="handlePanning"
              @mouseup="stopPanning"
              @mouseleave="stopPanning"
            >
              <div 
                class="image-container"
                :style="containerTransformStyle"
              >
                <img
                  :src="sourceImageUrl"
                  class="source-image"
                  ref="imageElement"
                  @load="handleImageLoad"
                  alt="Source"
                />
                <svg
                  v-if="overlaySize.width && overlaySize.height"
                  class="line-overlay"
                  :style="overlayStyle"
                  :viewBox="viewBox"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <g
                    v-for="(line, index) in lineItems"
                    :key="index"
                    :class="['line-polygon', { active: index === highlightedLine }]"
                    @mouseenter="setHighlightedLine(index)"
                    @mouseleave="setHighlightedLine(null)"
                    @click="setHighlightedLine(index)"
                  >
                    <polygon :points="line.points" />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </v-sheet>
      </v-col>

      <!-- Metadata / list -->
      <v-col cols="4" class="info-column">
        <v-sheet class="pa-4 fill-height d-flex flex-column">
          <div class="mb-4">
            <h3 class="text-h6 mb-1">{{ state.file?.label || 'Line Segments' }}</h3>
            <p class="text-caption text-medium-emphasis mb-0">
              {{ lineItems.length }} segments detected
            </p>
          </div>

          <v-divider class="mb-4"></v-divider>

          <div class="line-list flex-grow-1">
            <v-list
              density="comfortable"
              class="line-list-scroll"
            >
              <v-list-item
                v-for="(line, index) in lineItems"
                :key="index"
                :value="index"
                :class="{ 'line-item-active': index === highlightedLine }"
                @mouseenter="setHighlightedLine(index)"
                @mouseleave="setHighlightedLine(null)"
                @click="setHighlightedLine(index)"
              >
                <template #prepend>
                  <v-avatar size="28" :color="index === highlightedLine ? 'primary' : 'grey-lighten-3'">
                    <span class="text-body-2">{{ index + 1 }}</span>
                  </v-avatar>
                </template>
                <v-list-item-title>
                  Line {{ index + 1 }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  <span v-if="line.confidence !== null">Conf: {{ line.confidence.toFixed(3) }}</span>
                  <span v-if="line.box" class="ml-2">
                    {{ Math.round(line.box.width) }}×{{ Math.round(line.box.height) }}
                  </span>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </div>

          <v-divider class="my-4"></v-divider>

          <!-- Zoom Controls -->
          <div class="mb-4">
            <div class="text-caption text-medium-emphasis mb-2">Zoom & Pan</div>
            <div class="d-flex gap-2 align-center">
              <v-btn
                size="x-small"
                variant="outlined"
                icon="mdi-minus"
                @click="zoomOut"
                :disabled="imageScale <= 0.5"
              ></v-btn>
              <span class="text-caption flex-grow-1 text-center">
                {{ Math.round(imageScale * 100) }}%
              </span>
              <v-btn
                size="x-small"
                variant="outlined"
                icon="mdi-plus"
                @click="zoomIn"
                :disabled="imageScale >= 3"
              ></v-btn>
              <v-btn
                size="x-small"
                variant="outlined"
                icon="mdi-fit-to-screen"
                @click="resetZoom"
                class="ml-2"
              ></v-btn>
            </div>
            <p class="text-caption text-medium-emphasis mt-2 mb-0">
              Scroll to zoom · Drag to pan (when zoomed)
            </p>
          </div>

          <v-divider class="my-4"></v-divider>

          <div class="text-caption text-medium-emphasis">
            <div>Image size: {{ state.imageShape.width }} × {{ state.imageShape.height }} px</div>
            <div v-if="state.file">
              File: {{ state.file.extension }} · {{ state.file.type }}
            </div>
          </div>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import web from '../../web.js'
import { store } from '../Store.js'

const apiUrl = import.meta.env.VITE_API_PATH
const emit = defineEmits(['change-tab'])
const props = defineProps(['tab'])

const state = reactive({
  file: null,
  source: null,
  polygons: [],
  confidences: [],
  boxes: [],
  imageShape: {
    width: 0,
    height: 0
  }
})

const loading = ref(false)
const highlightedLine = ref(null)
const imageElement = ref(null)
const overlaySize = reactive({ width: 0, height: 0 })

// Zoom and pan state
const imageScale = ref(1)
const panX = ref(0)
const panY = ref(0)
const isPanning = ref(false)
const lastPanX = ref(0)
const lastPanY = ref(0)

const sourceImageUrl = computed(() => {
  if (!state.source?.path) return null
  return `${apiUrl}/api/thumbnails/${state.source.path}`
})

const lineItems = computed(() => {
  return state.polygons.map((polygon, index) => {
    const box = state.boxes[index]
    const confidence = state.confidences[index] ?? null
    return {
      polygon,
      points: polygon.map(([x, y]) => `${x},${y}`).join(' '),
      confidence,
      box: box
        ? {
            width: box[2] - box[0],
            height: box[3] - box[1]
          }
        : null
    }
  })
})

const viewBox = computed(() => {
  const w = state.imageShape.width || 1
  const h = state.imageShape.height || 1
  return `0 0 ${w} ${h}`
})

const overlayStyle = computed(() => ({
  width: `${overlaySize.width}px`,
  height: `${overlaySize.height}px`
}))

const containerTransformStyle = computed(() => ({
  transform: `scale(${imageScale.value}) translate(${panX.value}px, ${panY.value}px)`,
  cursor: imageScale.value > 1 ? (isPanning.value ? 'grabbing' : 'grab') : 'default'
}))

watch(
  () => props.tab,
  async () => {
    await loadData()
  }
)

async function loadData () {
  loading.value = true
  highlightedLine.value = null
  resetZoom()

  try {
    const fileInfo = await web.getDocInfo(store.file['@rid'])
    state.file = fileInfo

    if (store.source) {
      state.source = await web.getDocInfo(store.source)
    } else {
      state.source = null
    }

    let rawData = await web.getNodeFile(state.file['@rid'])
    rawData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData

    state.polygons = rawData.line_polygons || []
    state.confidences = rawData.line_confs || []
    state.boxes = rawData.line_boxes || []
    const shape = rawData.image_shape || [0, 0]
    state.imageShape.width = shape[1] || 0
    state.imageShape.height = shape[0] || 0

    await nextTick()
    updateOverlaySize()
  } catch (error) {
    console.error('Failed to load line segmentation data', error)
  } finally {
    loading.value = false
  }
}

function handleImageLoad () {
  nextTick(() => {
    updateOverlaySize()
    
    // Set up ResizeObserver after image loads
    if (imageElement.value && !imageElement.value._resizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        updateOverlaySize()
      })
      resizeObserver.observe(imageElement.value)
      imageElement.value._resizeObserver = resizeObserver
    }
  })
}

function updateOverlaySize () {
  if (imageElement.value) {
    // Get the actual displayed size of the image
    const rect = imageElement.value.getBoundingClientRect()
    overlaySize.width = rect.width
    overlaySize.height = rect.height
  }
}

function setHighlightedLine (index) {
  highlightedLine.value = index
}

// Zoom and pan functions
function handleImageWheel (event) {
  event.preventDefault()
  const delta = event.deltaY > 0 ? -0.1 : 0.1
  const oldScale = imageScale.value
  imageScale.value = Math.max(0.5, Math.min(3, imageScale.value + delta))
  
  // Adjust pan position to zoom towards mouse position
  if (imageScale.value > 1) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left - rect.width / 2
    const y = event.clientY - rect.top - rect.height / 2
    
    panX.value += x * (1 - oldScale / imageScale.value)
    panY.value += y * (1 - oldScale / imageScale.value)
  } else {
    // Reset pan when zoomed out
    panX.value = 0
    panY.value = 0
  }
}

function startPanning (event) {
  if (imageScale.value > 1 && event.button === 0) {
    event.preventDefault()
    isPanning.value = true
    lastPanX.value = event.clientX
    lastPanY.value = event.clientY
  }
}

function handlePanning (event) {
  if (isPanning.value && imageScale.value > 1) {
    event.preventDefault()
    const deltaX = event.clientX - lastPanX.value
    const deltaY = event.clientY - lastPanY.value
    
    panX.value += deltaX / (imageScale.value * 0.5)
    panY.value += deltaY / (imageScale.value * 0.5)
    
    lastPanX.value = event.clientX
    lastPanY.value = event.clientY
  }
}

function stopPanning () {
  isPanning.value = false
}

function zoomIn () {
  imageScale.value = Math.min(3, imageScale.value + 0.25)
}

function zoomOut () {
  const oldScale = imageScale.value
  imageScale.value = Math.max(0.5, imageScale.value - 0.25)
  if (imageScale.value <= 1) {
    panX.value = 0
    panY.value = 0
  }
}

function resetZoom () {
  imageScale.value = 1
  panX.value = 0
  panY.value = 0
}

onMounted(async () => {
  window.addEventListener('resize', updateOverlaySize)
  await loadData()
  
  // Use ResizeObserver to track image size changes
  if (imageElement.value) {
    const resizeObserver = new ResizeObserver(() => {
      updateOverlaySize()
    })
    resizeObserver.observe(imageElement.value)
    
    // Store observer for cleanup
    imageElement.value._resizeObserver = resizeObserver
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateOverlaySize)
  if (imageElement.value?._resizeObserver) {
    imageElement.value._resizeObserver.disconnect()
  }
})
</script>

<style scoped>
.line-segmentation-display {
  height: 100%;
  margin-left: 60px !important;
}

.image-column {
  background: #fafafa;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
}

.info-column {
  background: #fff;
}

.image-wrapper {
  position: relative;
  flex: 1;
  min-height: 400px;
}

.image-stage {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  user-select: none;
}

.image-container {
  position: relative;
  display: inline-block;
}

.source-image {
  max-width: 100%;
  max-height: calc(100vh - 160px);
  object-fit: contain;
  display: block;
}

.line-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: all;
}

.line-polygon polygon {
  fill: rgba(33, 150, 243, 0.12);
  stroke: #2196f3;
  stroke-width: 4;
  vector-effect: non-scaling-stroke;
}

.line-polygon.active polygon {
  fill: rgba(255, 193, 7, 0.25);
  stroke: #ffc107;
}

.placeholder {
  height: 100%;
  border: 1px dashed rgba(0, 0, 0, 0.15);
  border-radius: 8px;
}

.line-list {
  overflow: hidden;
}

.line-list-scroll {
  max-height: calc(100vh - 260px);
  overflow-y: auto;
}

.line-item-active {
  background: rgba(33, 150, 243, 0.08);
}
</style>

