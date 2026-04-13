<template>
  <v-container fluid class="pa-0 file-display-wrapper">
    <!-- Close Button -->
    <v-btn
      class="ma-2"
      color="primary"
      icon="mdi-close"
      style="position: absolute; top: 0; left: -60px; z-index:1000"
      @click="closeFileView"
    ></v-btn>

    <!-- Top Bar: contextual (Set or Search) -->
    <SetTools
      v-if="store.file_browse_context && store.file_browse_context.mode === 'set'"
      :context="store.file_browse_context"
      :skip="state.skip"
      :fileCount="state.file_count"
      @prev="prev"
      @next="next"
      @close="closeFileView"
      @toggle-grouped-boundary="onToggleGroupedBoundary"
    />
    <SearchTools
      v-else-if="store.file_browse_context && store.file_browse_context.mode === 'search'"
      :context="store.file_browse_context"
      @file-changed="onSearchFileChanged"
      @back-to-results="goToSearch"
      @close="closeFileView"
    />

    <v-row no-gutters class="fill-height">
      <!-- LEFT COLUMN: Path Panel -->
      <v-col :cols="state.pathCollapsed ? 'auto' : 2" class="flex-grow-0">
        <PathPanel
          :fileRid="store.file ? store.file['@rid'] : null"
          :collapsed="state.pathCollapsed"
          @toggle-collapse="state.pathCollapsed = !state.pathCollapsed"
          @image-click="handleImageClick"
          @ancestor-click="handleAncestorClick"
        />
      </v-col>

      <!-- CENTER COLUMN: Content display (selected by file type) -->
      <v-col class="center-column flex-grow-1">
        <template v-if="store.filter_editor">
          <ImageROIDisplay />
        </template>
        <template v-else-if="store.file">
          <component
            :is="displayComponent"
          />
        </template>
      </v-col>

      <!-- RIGHT COLUMN: File Tools (hidden during ROI editing) -->
      <v-col v-if="!store.filter_editor" :cols="state.toolsCollapsed ? 'auto' : 2" class="flex-grow-0">
        <FileTools
          :file="store.file"
          :entities="state.entities"
          :collapsed="state.toolsCollapsed"
          :toast="state.toast"
          @toggle-collapse="state.toolsCollapsed = !state.toolsCollapsed"
          @refresh="refreshContent"
          @file-updated="onFileUpdated"
          @save-edit="saveImageEdit"
          @revert-edit="revertImageEdit"
          @rotate-left="rotateLeft"
          @rotate-right="rotateRight"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import web from '../../web.js'
import { store } from '../Store.js'

const route = useRoute()
const router = useRouter()

// Top bar components
import SetTools from './SetTools.vue'
import SearchTools from './SearchTools.vue'
import PathPanel from './PathPanel.vue'
import FileTools from './FileTools.vue'

// Display components
import ImageROIDisplay from './ImageROIDisplay.vue'
import MultiDisplay from './MultiDisplay.vue'
import PDFDisplay from './PDFDisplay.vue'
import HOCRDisplay from './HOCRDisplay.vue'
import TextDisplay from './TextDisplay.vue'
import OCRDisplay from './OCRDisplay.vue'
import OSDDisplay from './OSDDisplay.vue'
import HumanJSONDisplay from './HumanJSONDisplay.vue'
import NER_Display from './NER_Display.vue'
import TextRawDisplay from './TextRawDisplay.vue'
import SimilarityDisplay from './SimilarityDisplay.vue'
import LineSegmentationDisplay from './LineSegmentationDisplay.vue'
import JSONDisplay from './JSONDisplay.vue'

const props = defineProps({
  projectRid: { type: String, default: null }
})

const effectiveProjectRid = computed(() => props.projectRid || route.params.rid || null)
let fileLoadToken = 0

// Type → display component mapping
const typeMap = {
  'image': MultiDisplay,
  'pdf': PDFDisplay,
  'csv': TextDisplay,
  'ocr.json': OCRDisplay,
  'polygons.json': LineSegmentationDisplay,
  'osd.json': OSDDisplay,
  'human.json': HumanJSONDisplay,
  'ner.json': NER_Display,
  'dspace7.json': TextRawDisplay,
  'similarity.json': SimilarityDisplay,
}

const extensionMap = {
  'hocr': HOCRDisplay,
  'json': JSONDisplay,
  'txt': MultiDisplay,
}

const displayComponent = computed(() => {
  if (!store.file) return null
  const file = store.file

  // Check type first
  if (file.type && typeMap[file.type]) return typeMap[file.type]

  // Special: text + txt → MultiDisplay
  if (file.type === 'text' && file.extension === 'txt') return MultiDisplay

  // Similarity label fallback
  if (file.extension === 'json' && file.label && file.label.includes('similarity')) return SimilarityDisplay

  // Extension fallback
  if (file.extension && extensionMap[file.extension]) return extensionMap[file.extension]

  return JSONDisplay
})

var state = reactive({
  entities: {},
  pathCollapsed: false,
  toolsCollapsed: false,
  skip: 1,
  file_count: 0,
  imageRotation: 0,
  toast: { show: false, text: '', color: 'success' },
})

function showToast(text, color = 'success') {
  state.toast.text = text
  state.toast.color = color
  state.toast.show = true
  setTimeout(() => { state.toast.show = false }, 2600)
}

// --- Set tools navigation ---
async function prev() {
  const ctx = store.file_browse_context
  if (!ctx || ctx.mode !== 'set') return

  if (ctx.source_rid && ctx.grouped_boundary_enabled) {
    // Grouped navigation (delegate to existing logic through set files)
    if (state.skip <= 1) return
    state.skip--
  } else {
    if (state.skip <= 1) return
    state.skip--
  }
  await loadSetFile(state.skip - 1)
}

async function next() {
  const ctx = store.file_browse_context
  if (!ctx || ctx.mode !== 'set') return

  if (state.skip >= state.file_count) return
  state.skip++
  await loadSetFile(state.skip - 1)
}

async function loadSetFile(skipIndex) {
  const ctx = store.file_browse_context
  if (!ctx) return
  const setRid = ctx.set_rid || store.source || store.current_node?.id
  if (!setRid) return

  const response = await web.getSetFiles(setRid, skipIndex, 1)
  if (response.files && response.files.length > 0) {
    const file = response.files[0]
    store.file = await web.getDocInfo(file['@rid'])
    // Update URL to reflect the new file
    navigateToFile(file['@rid'])
  }
}

function onToggleGroupedBoundary(enabled) {
  if (store.file_browse_context) {
    store.file_browse_context.grouped_boundary_enabled = enabled
  }
}

// --- Search tools ---
async function onSearchFileChanged(file) {
  if (file && file['@rid']) {
    navigateToFile(file['@rid'])
  }
  state.entities = await web.getEntities()
}

// --- File tools ---
function onFileUpdated(updatedFile) {
  store.file = updatedFile
}

async function refreshContent() {
  if (store.file?.['@rid']) {
    try {
      await web.createFileThumbnail(store.file['@rid'])
    } catch (e) {
      console.error('Thumbnail refresh failed:', e)
    }
  }
  store.file = await web.getDocInfo(store.file['@rid'])
  state.entities = await web.getEntities()
}

// --- Version/rotation tools ---
function normalizeRotation(value) {
  const mod = value % 360
  return mod < 0 ? mod + 360 : mod
}

function rotateLeft() {
  state.imageRotation = normalizeRotation(state.imageRotation - 90)
}

function rotateRight() {
  state.imageRotation = normalizeRotation(state.imageRotation + 90)
}

async function rotateImageBlob(blob, degrees) {
  const normalized = normalizeRotation(degrees)
  if (normalized === 0) return blob

  const url = URL.createObjectURL(blob)
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })

    const canvas = document.createElement('canvas')
    const swapSides = normalized === 90 || normalized === 270
    canvas.width = swapSides ? image.height : image.width
    canvas.height = swapSides ? image.width : image.height

    const context = canvas.getContext('2d')
    if (!context) return blob
    context.translate(canvas.width / 2, canvas.height / 2)
    context.rotate((normalized * Math.PI) / 180)
    context.drawImage(image, -image.width / 2, -image.height / 2)

    const output = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b || blob), blob.type || 'image/png', 0.95)
    })
    return output
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function saveImageEdit() {
  if (!store.file?.['@rid']) return
  try {
    const originalBlob = await web.getNodeFileBlob(store.file['@rid'])
    const rotatedBlob = await rotateImageBlob(originalBlob, state.imageRotation)
    await web.createFileVersion(store.file['@rid'], {
      file: rotatedBlob,
      filename: store.file.label || 'edited-image.png',
      operation: 'rotate',
      params: { degrees: normalizeRotation(state.imageRotation) },
    })
    await web.createFileThumbnail(store.file['@rid'])
    store.file = await web.getDocInfo(store.file['@rid'])
    state.imageRotation = 0
    showToast('Edited version saved', 'success')
  } catch (e) {
    console.error('Error saving image edit:', e)
    showToast('Saving edited version failed', 'error')
  }
}

async function revertImageEdit() {
  if (!store.file?.['@rid']) return
  try {
    await web.revertFileVersion(store.file['@rid'])
    await web.createFileThumbnail(store.file['@rid'])
    store.file = await web.getDocInfo(store.file['@rid'])
    state.imageRotation = 0
    showToast('Reverted to original', 'success')
  } catch (e) {
    console.error('Error reverting image edit:', e)
    showToast('Revert failed', 'error')
  }
}

function handleImageClick(imagePath) {
  // placeholder — can expand to preview
}

function handleAncestorClick(node) {
  if (node['@rid']) {
    const rid = node['@rid'].replace('#', '')
    router.push({ name: 'project-graph', params: { rid: effectiveProjectRid.value || rid } })
  }
}

// --- Router navigation ---
function closeFileView() {
  if (effectiveProjectRid.value) {
    router.push({ name: 'project-graph', params: { rid: effectiveProjectRid.value } })
  } else {
    router.back()
  }
}

function goToSearch() {
  if (effectiveProjectRid.value) {
    router.push({ name: 'project-search', params: { rid: effectiveProjectRid.value } })
  }
}

// Navigate to a different file within the same project
function navigateToFile(fileRid) {
  if (effectiveProjectRid.value && fileRid) {
    const rid = fileRid.replace('#', '')
    router.push({ name: 'project-file', params: { rid: effectiveProjectRid.value, fileRid: rid } })
  }
}

// --- Keyboard navigation ---
function handleKeyUp(event) {
  if (event.key === 'ArrowLeft') prev()
  if (event.key === 'ArrowRight') next()
}

// --- Load ---
async function load() {
  state.entities = await web.getEntities()

  // Load file from route params if not already loaded
  const fileRid = route.params.fileRid
  if (fileRid && (!store.file || store.file['@rid'] !== '#' + fileRid)) {
    const token = ++fileLoadToken
    const loaded = await web.getDocInfo('#' + fileRid)
    if (token !== fileLoadToken) return
    if (route.params.fileRid !== fileRid) return
    store.file = loaded
  }

  // Initialize navigation state from store
  const ctx = store.file_browse_context
  if (ctx && ctx.mode === 'set') {
    state.file_count = ctx.file_count || store.file_count || 0
    state.skip = ctx.skip || (store.skip >= 0 ? store.skip + 1 : 1)
  } else {
    state.file_count = store.file_count || 0
    state.skip = store.skip >= 0 ? store.skip + 1 : 1
  }
}

// Watch route changes to load new file
watch(() => route.params.fileRid, async (newRid) => {
  if (newRid) {
    const token = ++fileLoadToken
    const loaded = await web.getDocInfo('#' + newRid)
    if (token !== fileLoadToken) return
    if (route.params.fileRid !== newRid) return
    store.file = loaded
    state.entities = await web.getEntities()
  }
})

onMounted(async () => {
  window.addEventListener('keyup', handleKeyUp)
  await load()
})

onUnmounted(() => {
  window.removeEventListener('keyup', handleKeyUp)
})
</script>

<style scoped>
.file-display-wrapper {
  max-width: 100% !important;
  margin-left: 60px !important;
}

.center-column {
  height: calc(100vh - 64px);
  overflow-y: auto;
  background: white;
}
</style>
