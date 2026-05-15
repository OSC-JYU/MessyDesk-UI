<template>
  <v-container fluid class="pa-0 file-display-wrapper">
    <v-btn
      v-if="showStandaloneCloseButton"
      class="standalone-close-btn"
      color="primary"
      icon="mdi-close"
      size="small"
      @click="closeFileView"
    ></v-btn>

    <!-- Top Bar: contextual (Set or Search) -->
    <SetTools
      v-if="store.file_browse_context && store.file_browse_context.mode === 'set'"
      :context="store.file_browse_context"
      :file="store.file"
      :skip="state.skip"
      :fileCount="state.file_count"
      @prev="prev"
      @next="next"
      @back-to-set="backToSetView"
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
          :fileRid="state.contextFileRid || (store.file ? store.file['@rid'] : null)"
          :selectedRid="store.file ? store.file['@rid'] : null"
          :lineage-level="state.lineageLevel"
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
            v-bind="displayProps"
          />
        </template>
      </v-col>

      <!-- RIGHT COLUMN: File Tools (hidden during ROI editing) -->
      <v-col v-if="!store.filter_editor" :cols="state.toolsCollapsed ? 'auto' : 2" class="flex-grow-0">
        <FileTools
          :file="store.file"
          :imageRotation="state.imageRotation"
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

const displayProps = computed(() => {
  if (displayComponent.value === MultiDisplay) {
    return { imageRotation: state.imageRotation }
  }
  return {}
})

const showStandaloneCloseButton = computed(() => {
  const mode = store.file_browse_context?.mode
  return mode !== 'set' && mode !== 'search'
})

var state = reactive({
  entities: {},
  pathCollapsed: false,
  toolsCollapsed: false,
  skip: 1,
  file_count: 0,
  imageRotation: 0,
  contextFileRid: null,
  lineageLevel: 0,
  lineageOffset: 0,
  toast: { show: false, text: '', color: 'success' },
})

let pendingContextRid = null

function ridToQueryValue(rid) {
  if (!rid) return ''
  return String(rid).replace('#', '')
}

function queryToRid(value) {
  if (value === undefined || value === null || value === '') return null
  const normalized = String(value)
  return normalized.startsWith('#') ? normalized : '#' + normalized
}

function toNonNegativeInt(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 0) return fallback
  return parsed
}

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback
  if (typeof value === 'boolean') return value
  const normalized = String(value).toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
}

function setModeQueryFromStoreContext() {
  const ctx = store.file_browse_context
  if (!ctx || ctx.mode !== 'set') return undefined

  return {
    browseMode: 'set',
    setRid: ridToQueryValue(ctx.set_rid),
    setLabel: ctx.set_label || '',
    fileCount: String(toNonNegativeInt(ctx.file_count, 0)),
    skip: String(toNonNegativeInt(ctx.skip, 0)),
    sourceRid: ridToQueryValue(ctx.source_rid),
    sourceLabel: ctx.source_label || ''
  }
}

function hydrateBrowseContextFromRouteQuery() {
  const query = route.query || {}
  if (query.browseMode !== 'set') return false

  const setRid = queryToRid(query.setRid)
  if (!setRid) {
    store.file_browse_context = null
    return false
  }

  const sourceRid = queryToRid(query.sourceRid)
  const fileCount = toNonNegativeInt(query.fileCount, 0)
  const skip = toNonNegativeInt(query.skip, 0)

  store.file_browse_context = {
    mode: 'set',
    set_rid: setRid,
    set_label: query.setLabel ? String(query.setLabel) : null,
    file_count: fileCount,
    skip,
    source_rid: sourceRid,
    source_label: query.sourceLabel ? String(query.sourceLabel) : null,
  }

  store.source = setRid
  store.file_count = fileCount
  store.skip = skip
  return true
}

function showToast(text, color = 'success') {
  state.toast.text = text
  state.toast.color = color
  state.toast.show = true
  setTimeout(() => { state.toast.show = false }, 2600)
}

function isReferenceFile(file) {
  if (!file) return false
  return Boolean(file.ref || file.ref_rid)
}

// --- Set tools navigation ---
async function prev() {
  const ctx = store.file_browse_context
  if (!ctx || ctx.mode !== 'set') return

  if (state.skip <= 1) return
  state.skip--
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
    // Keep shared browse context skip in 0-based indexing.
    if (store.file_browse_context) {
      store.file_browse_context.skip = skipIndex
    }
    store.skip = skipIndex
    state.skip = skipIndex + 1
    const contextRid = file['@rid']
    const displayRid = await resolveDisplayedRidForContext(contextRid)
    navigateToFile(displayRid, { preserveContext: true, contextRid })
  }
}

// --- Search tools ---
async function onSearchFileChanged(file) {
  if (file && file['@rid']) {
    const contextRid = file['@rid']
    const displayRid = await resolveDisplayedRidForContext(contextRid)
    navigateToFile(displayRid, { preserveContext: true, contextRid })
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
  if (isReferenceFile(store.file)) {
    showToast('Reference files cannot be versioned', 'error')
    return
  }
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
  if (isReferenceFile(store.file)) {
    showToast('Reference files cannot be versioned', 'error')
    return
  }
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
  const clickedNode = node?.node || node
  const fileOffsetFromContext = node?.fileOffsetFromContext
  const fileLevelFromCurrent = node?.fileLevelFromCurrent

  if (!clickedNode || !clickedNode['@rid']) return

  const nodeType = String(clickedNode['@type'] || '').toLowerCase()
  const fileType = String(clickedNode.type || '').toLowerCase()
  const isFileNode = nodeType === 'file'
  const isBlocked = nodeType === 'zip' || nodeType === 'source' || nodeType === 'project' || fileType === 'zip'
  if (!isFileNode || isBlocked) return

  if (typeof fileOffsetFromContext === 'number' && Number.isFinite(fileOffsetFromContext)) {
    state.lineageOffset = fileOffsetFromContext
    state.lineageLevel = Math.abs(fileOffsetFromContext)
  } else if (typeof fileLevelFromCurrent === 'number' && fileLevelFromCurrent >= 0) {
    state.lineageLevel = fileLevelFromCurrent
    state.lineageOffset = -fileLevelFromCurrent
  }

  const contextRid = state.contextFileRid || (store.file ? store.file['@rid'] : null)
  navigateToFile(clickedNode['@rid'], { preserveContext: true, contextRid })
}

// --- Router navigation ---
function closeFileView() {
  if (effectiveProjectRid.value) {
    router.push({ name: 'project-graph', params: { rid: effectiveProjectRid.value } })
  } else {
    router.back()
  }
}

function backToSetView() {
  const ctx = store.file_browse_context
  if (!effectiveProjectRid.value || !ctx || ctx.mode !== 'set' || !ctx.set_rid) {
    closeFileView()
    return
  }

  const query = {
    openSet: String(ctx.set_rid).replace('#', '')
  }

  if (ctx.source_rid) {
    query.sourceRid = String(ctx.source_rid).replace('#', '')
  }

  router.push({
    name: 'project-graph',
    params: { rid: effectiveProjectRid.value },
    query
  })
}

function goToSearch() {
  if (effectiveProjectRid.value) {
    router.push({ name: 'project-search', params: { rid: effectiveProjectRid.value } })
  }
}

// Navigate to a different file within the same project
async function navigateToFile(fileRid, options = {}) {
  if (effectiveProjectRid.value && fileRid) {
    const preserveContext = Boolean(options.preserveContext)
    const query = preserveContext ? setModeQueryFromStoreContext() : undefined
    const normalizedRid = String(fileRid).startsWith('#') ? String(fileRid) : '#' + String(fileRid)
    const routeRid = route.params.fileRid ? ('#' + String(route.params.fileRid).replace('#', '')) : null

    if (preserveContext) {
      pendingContextRid = options.contextRid || state.contextFileRid || (store.file ? store.file['@rid'] : null)
      // Keep lineage source in sync immediately, even if route does not change.
      state.contextFileRid = pendingContextRid
    } else {
      pendingContextRid = null
      state.contextFileRid = normalizedRid
      state.lineageLevel = 0
      state.lineageOffset = 0
    }

    // If target is already visible route, update file without relying on route watcher.
    if (routeRid === normalizedRid) {
      const currentSetMode = route.query?.browseMode === 'set'
      const incomingSetMode = Boolean(query && query.browseMode === 'set')
      if (currentSetMode !== incomingSetMode || (incomingSetMode && query.skip !== route.query?.skip)) {
        router.replace({
          name: 'project-file',
          params: { rid: effectiveProjectRid.value, fileRid: normalizedRid.replace('#', '') },
          query
        })
      }

      if (!store.file || store.file['@rid'] !== normalizedRid) {
        const loaded = await web.getDocInfo(normalizedRid)
        store.file = loaded
      }
      pendingContextRid = null
      return
    }

    const rid = normalizedRid.replace('#', '')
    router.push({
      name: 'project-file',
      params: { rid: effectiveProjectRid.value, fileRid: rid },
      query
    })
  }
}

async function resolveDisplayedRidForContext(contextRid) {
  if (!contextRid) return contextRid
  if (!state.lineageOffset) return contextRid

  try {
    const normalizedContextRid = String(contextRid).startsWith('#') ? String(contextRid) : '#' + String(contextRid)
    const path = await web.getNodePath(normalizedContextRid)
    const fileNodes = (path || []).filter((entry) => {
      const type = String(entry?.['@type'] || '').toLowerCase()
      const fileType = String(entry?.type || '').toLowerCase()
      return type === 'file' && fileType !== 'zip'
    })
    if (!fileNodes.length) return normalizedContextRid

    const contextIndex = fileNodes.findIndex((entry) => entry?.['@rid'] === normalizedContextRid)
    if (contextIndex < 0) return normalizedContextRid

    const targetIndex = Math.max(0, Math.min(fileNodes.length - 1, contextIndex + state.lineageOffset))
    return fileNodes[targetIndex]?.['@rid'] || normalizedContextRid
  } catch (e) {
    return contextRid
  }
}

// --- Keyboard navigation ---
function handleKeyUp(event) {
  if (event.key === 'ArrowLeft') prev()
  if (event.key === 'ArrowRight') next()
}

// --- Load ---
async function load() {
  hydrateBrowseContextFromRouteQuery()
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

  if (!state.contextFileRid && fileRid) {
    state.contextFileRid = '#' + fileRid
  }

  // Initialize navigation state from store
  const ctx = store.file_browse_context
  if (ctx && ctx.mode === 'set') {
    state.file_count = ctx.file_count || store.file_count || 0
    const ctxSkip = Number(ctx.skip)
    const storeSkip = Number(store.skip)
    const zeroBasedSkip = Number.isFinite(ctxSkip)
      ? ctxSkip
      : (Number.isFinite(storeSkip) && storeSkip >= 0 ? storeSkip : 0)
    state.skip = zeroBasedSkip + 1
  } else {
    state.file_count = store.file_count || 0
    state.skip = store.skip >= 0 ? store.skip + 1 : 1
  }
}

// Watch route changes to load new file
watch(() => route.params.fileRid, async (newRid) => {
  if (newRid) {
    hydrateBrowseContextFromRouteQuery()
    const token = ++fileLoadToken
    const loaded = await web.getDocInfo('#' + newRid)
    if (token !== fileLoadToken) return
    if (route.params.fileRid !== newRid) return
    store.file = loaded
    if (pendingContextRid) {
      state.contextFileRid = pendingContextRid
      pendingContextRid = null
    } else {
      state.contextFileRid = '#' + newRid
      state.lineageLevel = 0
      state.lineageOffset = 0
    }
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
  margin-left: 0 !important;
}

.center-column {
  height: calc(100vh - 64px);
  overflow-y: auto;
  background: white;
}

.standalone-close-btn {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1000;
}
</style>
