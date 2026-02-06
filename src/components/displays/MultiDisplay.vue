<template>
  <v-container fluid class="pa-0 multidisplay-container">
    <!-- Close Button -->
    <v-btn
      class="ma-2"
      color="primary"
      icon="mdi-close"
      style="position: absolute; top: 0; left: -60px; z-index:1000"
      @click="$emit('change-tab',store.tab)"
    ></v-btn>

    <v-row no-gutters class="fill-height">
      <!-- LEFT COLUMN - Node Path and Expandable Content -->
      <v-col :cols="state.leftColumnCollapsed ? 0 : (state.expandedContent ? 3 : 2)" class="left-column" :class="{ 'collapsed': state.leftColumnCollapsed }">
        <v-sheet class="d-flex flex-column fill-height">
          <!-- Navigation Path or Expanded Content -->
          <div class="pa-3">
            <template v-if="!state.expandedContent">
              <NodePath 
                :nodepath="state.nodepath" 
                :apiUrl="apiUrl"
                @image-click="toggleContentExpand"
              />
            </template>
            <template v-else>
              <div class="expanded-content-container" 
                   @wheel="handleContentWheel"
                   @mousedown="startPanning"
                   @mousemove="handlePanning"
                   @mouseup="stopPanning"
                   @mouseleave="stopPanning">
                <div class="content-wrapper">
                  <!-- Expanded Image -->
                  <img v-if="state.expandedContentType === 'image'" 
                       :src="apiUrl + '/api/thumbnails/' + state.expandedContent" 
                       class="expanded-image" 
                       :style="{ 
                         transform: `scale(${state.contentScale}) translate(${state.panX}px, ${state.panY}px)`,
                         cursor: state.contentScale > 1 ? (state.isPanning ? 'grabbing' : 'grab') : 'pointer'
                       }"
                       @click="handleContentClick" />
                  
                  <!-- Expanded Text -->
                  <div v-else-if="state.expandedContentType === 'text'" 
                       class="expanded-text"
                       :style="{ 
                         transform: `scale(${state.contentScale}) translate(${state.panX}px, ${state.panY}px)`
                       }">
                    <pre>{{ state.expandedTextContent }}</pre>
                  </div>
                </div>
                <v-btn
                  class="close-expanded-content"
                  icon="mdi-close"
                  size="small"
                  @click="toggleContentExpand(null)"
                ></v-btn>
              </div>
            </template>
          </div>

          <!-- Additional Node Content Display -->
          <v-sheet v-if="state.file && (state.file.type === 'pdf' || state.file.type === 'image')" 
                  class="flex-grow-1 d-flex align-center justify-center pa-2">
            <div class="content-wrapper">
              <img :src="apiUrl + '/api/thumbnails/' + state.file.path" 
                   class="responsive-image" 
                   :style="{ maxHeight: 'calc(100vh - 200px)' }" />
            </div>
          </v-sheet>
        </v-sheet>
      </v-col>

      <!-- CENTER COLUMN - Main Content -->
      <v-col :cols="state.leftColumnCollapsed ? (state.expandedContent ? 10 : 10) : (state.expandedContent ? 7 : 8)" class="center-column">
        <v-sheet class="main-content pa-4" ref="contentContainer">
          <!-- Header with toggle button -->
          <div class="d-flex align-center justify-space-between mb-4">
            <h3 class="text-h6">{{ state.file ? state.file.label : 'Content' }}</h3>
            <v-btn
              size="small"
              variant="outlined"
              @click="toggleLeftColumn"
              class="toggle-button"
              color="primary"
            >
              <v-icon>{{ state.leftColumnCollapsed ? 'mdi-menu-left' : 'mdi-menu-right' }}</v-icon>
              {{ state.leftColumnCollapsed ? 'Show' : 'Hide' }}
            </v-btn>
          </div>
          
          <!-- JSON Content -->
          <div v-if="state.contentType === 'json'" class="json-content">
            <pre>{{ state.content }}</pre>
          </div>
          
          <!-- Text Content -->
          <div v-else-if="state.contentType === 'text'" class="text-content" v-html="state.content"></div>
          
          <!-- Image Content -->
          <div v-else-if="state.contentType === 'image'" class="image-content">
            <img v-if="state.file && state.file.path" 
                 :src="apiUrl + '/api/thumbnails/' + state.file.path" 
                 class="main-image" 
                 alt="Main content image" />
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
      </v-col>

      <!-- RIGHT COLUMN - Toolbar and Tags -->
      <v-col cols="2" class="right-column">
        <v-sheet class="toolbar pa-4">
          <!-- Navigation Controls -->
          <template v-if="state.file_count > 0">
            <div class="d-flex align-center justify-center mb-3">
              <v-btn @click="prev()" :disabled="state.skip == 1" color="secondary" size="x-small">
                <v-icon size="small">mdi-chevron-left</v-icon>
              </v-btn>
              <span class="mx-2 text-caption">{{state.skip}} / {{state.file_count}}</span>
              <v-btn @click="next()" :disabled="state.skip == state.file_count" color="secondary" size="x-small">
                <v-icon size="small">mdi-chevron-right</v-icon>
              </v-btn>
            </div>
          </template>

          <!-- File Info -->
          <div v-if="state.file" class="mb-3">
            <h4 class="text-subtitle-2 mb-2">{{ state.file.label}}</h4>
            <DescriptionEditor :description="state.file.description" :rid="state.file['@rid']"/>
            
            <!-- Entities/Tags -->
            <v-sheet class="mt-3">
              <div class="d-flex align-center mb-2">
                <v-icon class="mr-2" size="small">mdi-tag</v-icon>
                <span class="text-caption">Tags</span>
              </div>
              <v-chip 
                v-for="entity of state.file.entities" 
                :key="entity.type" 
                :color="entity.color" 
                variant="outlined"
                class="ma-1"
                size="x-small"
                @click="deleteOrOpenEntity($event, entity.rid)"
              >
                <v-icon :icon="'mdi-' + entity.icon.toLowerCase()" start size="x-small"></v-icon>
                {{ entity.label}}
                <v-icon v-if="state.isCtrlPressed" icon="mdi-close-circle" end size="x-small"></v-icon>
              </v-chip>
              <p v-if="state.file.entities && state.file.entities.length" class="text-caption mt-2">
                Ctrl + click to remove
              </p>
            </v-sheet>
          </div>

          <!-- Available Tags -->
          <v-list v-model:opened="state.open" density="compact">
            <v-list-group value="Available Tags">
              <template v-slot:activator="{ props }">
                <v-list-item v-bind="props" title="Available Tags" prepend-icon="mdi-tag-multiple" class="text-caption"></v-list-item>
              </template>

              <v-list-group v-for="type in state.entities" :key="type.type">
                <template v-slot:activator="{ props }">
                  <v-list-item v-bind="props" :title="type.type" :prepend-icon="'mdi-' + type.icon" class="text-caption"></v-list-item>
                </template>
                <v-chip 
                  v-for="item in type.items" 
                  :key="item['@rid']" 
                  :color="item.color"
                  class="ma-1"
                  size="x-small"
                  @click="linkEntityToItem(item['@rid'])"
                >
                  <v-icon :icon="'mdi-' + item.icon.toLowerCase()" start size="x-small"></v-icon>
                  {{ item.label }}
                </v-chip>
              </v-list-group>
            </v-list-group>
          </v-list>

          <!-- Action Buttons -->
          <div class="mt-3">
            <v-btn
              v-if="state.file"
              color="primary"
              class="mb-2"
              block
              size="x-small"
              :href="apiUrl + '/api/files/' + state.file['@rid'].replace('#','')"
              target="_blank"
            >
              <v-icon start size="small">mdi-open-in-new</v-icon>
              Open file
            </v-btn>
            
            <v-btn
              color="secondary"
              block
              size="x-small"
              @click="refreshContent"
            >
              <v-icon start size="small">mdi-refresh</v-icon>
              Refresh
            </v-btn>
          </div>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { onMounted, onUnmounted, reactive, ref, watch } from "vue";
import web from "../../web.js";
import {store} from "../../components/Store.js";
import DescriptionEditor from './DescriptionEditor.vue'
import NodePath from '../NodePath.vue'

const apiUrl = import.meta.env.VITE_API_PATH
const contentContainer = ref(null)

// Component events and props
const emit = defineEmits(['change-tab'])
const props = defineProps(['tab'])

// Watch for tab changes to reload content
watch(() => props.tab, async (newValue, oldValue) => {
  await load()
})

// Reactive state
var state = reactive({
  file: null,
  content: '',
  contentType: 'text', // 'text', 'json', 'image'
  entities: {},
  open: [],
  nodepath: [],
  expandedContent: null,
  expandedContentType: null, // 'image', 'text'
  expandedTextContent: '',
  contentScale: 1,
  panX: 0,
  panY: 0,
  isPanning: false,
  lastPanX: 0,
  lastPanY: 0,
  file_count: 0,
  skip: 1,
  isCtrlPressed: false,
  leftColumnCollapsed: false
})

// Navigation functions
async function prev() {
  if((state.skip - 1) < 1) return
  state.skip = state.skip - 1
  await loadFile(state.skip - 1)
}

async function next() {
  if(state.skip > state.file_count) return
  state.skip = state.skip + 1
  await loadFile(state.skip - 1)
}

// Content loading functions
async function loadFile(skip = 0) {
  try {
    var response = await web.getSetFiles(store.current_node.id, skip, 1)
    if (response.files && response.files.length > 0) {
      state.file = response.files[0]
      var fileContent = await web.getNodeFile(response.files[0]['@rid'])
      state.file = await web.getDocInfo(response.files[0]['@rid'])
      
      // Determine content type and format content
      determineContentType(fileContent)
      
      // Load node path
      var nodepath = await web.getNodePath(response.files[0]['@rid'])
      state.nodepath = nodepath
    }
  } catch (error) {
    console.error('Error loading file:', error)
  }
}

function determineContentType(content) {
  // Debug: Log file information
  console.log('File info:', state.file)
  console.log('Content type:', typeof content)
  console.log('Content preview:', typeof content === 'string' ? content.substring(0, 100) : content)
  
  // First check if the file is an image type
  if (state.file && (state.file.type === 'image' || state.file['@type'] === 'Image')) {
    state.contentType = 'image'
    state.content = content // Keep original content for image nodes
    state.leftColumnCollapsed = true // Collapse left column by default for images
    console.log('Detected as image type - left column collapsed')
    return
  }
  
  // For non-image files, determine type based on content
  if (typeof content === 'string') {
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(content)
      state.contentType = 'json'
      state.content = JSON.stringify(parsed, null, 2)
      console.log('Detected as JSON type')
    } catch (e) {
      // Not JSON, treat as text
      state.contentType = 'text'
      state.content = replaceWithBr(content)
      console.log('Detected as text type')
    }
  } else if (typeof content === 'object') {
    state.contentType = 'json'
    state.content = JSON.stringify(content, null, 2)
    console.log('Detected as JSON object type')
  } else {
    state.contentType = 'text'
    state.content = String(content)
    console.log('Detected as default text type')
  }
}

function replaceWithBr(text) {
  if(typeof text == 'string') {
    return text.replace(/\n/g, "<br />")
  } else {
    return text
  }
}

// Toggle functions
function toggleLeftColumn() {
  console.log('Toggle button clicked! Current state:', state.leftColumnCollapsed)
  state.leftColumnCollapsed = !state.leftColumnCollapsed
  console.log('New state:', state.leftColumnCollapsed)
}

// Content expansion functions
function toggleContentExpand(contentPath) {
  if (state.expandedContent === contentPath) {
    // Close expanded content
    state.expandedContent = null
    state.expandedContentType = null
    state.expandedTextContent = ''
  } else {
    // Open expanded content
    state.expandedContent = contentPath
    if (contentPath && state.file && state.file.type === 'image') {
      state.expandedContentType = 'image'
    } else {
      state.expandedContentType = 'text'
      state.expandedTextContent = state.content
    }
  }
  state.contentScale = 1
  state.panX = 0
  state.panY = 0
}

// Image/content interaction functions
function handleContentWheel(event) {
  event.preventDefault()
  const delta = event.deltaY > 0 ? -0.1 : 0.1
  const oldScale = state.contentScale
  state.contentScale = Math.max(0.5, Math.min(3, state.contentScale + delta))
  
  if (state.contentScale > 1) {
    const rect = event.target.getBoundingClientRect()
    const x = event.clientX - rect.left - rect.width / 2
    const y = event.clientY - rect.top - rect.height / 2
    
    state.panX += x * (1 - oldScale/state.contentScale)
    state.panY += y * (1 - oldScale/state.contentScale)
  }
}

function startPanning(event) {
  if (state.contentScale > 1 && event.button === 0) {
    event.preventDefault()
    state.isPanning = true
    state.lastPanX = event.clientX
    state.lastPanY = event.clientY
  }
}

function handlePanning(event) {
  if (state.isPanning && state.contentScale > 1) {
    event.preventDefault()
    const deltaX = event.clientX - state.lastPanX
    const deltaY = event.clientY - state.lastPanY
    
    state.panX += deltaX / (state.contentScale * 0.5)
    state.panY += deltaY / (state.contentScale * 0.5)
    
    state.lastPanX = event.clientX
    state.lastPanY = event.clientY
  }
}

function stopPanning() {
  state.isPanning = false
}

function handleContentClick(event) {
  if (state.contentScale <= 1 && !state.isPanning) {
    toggleContentExpand(null)
  }
}

// Entity/tag functions
async function linkEntityToItem(entityID) {
  try {
    await web.linkEntityToItem(entityID, state.file['@rid'])
    var response = await web.getDocInfo(state.file['@rid'])
    state.file = response
  } catch (error) {
    console.error('Error linking entity:', error)
  }
}

async function unLinkEntity(entityID) {
  try {
    await web.unLinkEntity(entityID, state.file['@rid'])
    var response = await web.getDocInfo(state.file['@rid'])
    state.file = response
  } catch (error) {
    console.error('Error unlinking entity:', error)
  }
}

async function deleteOrOpenEntity(event, entityID) {
  if (state.isCtrlPressed) {
    await unLinkEntity(entityID)
  } else {
    console.log('Show entity details')
  }
}

// Keyboard handling
function handleKeyDown(event) {
  if (event.ctrlKey) {
    state.isCtrlPressed = true
  }
}

function handleKeyUp(event) {
  state.isCtrlPressed = false
  if(event.key == 'ArrowLeft') prev()
  if(event.key == 'ArrowRight') next()
}

// Main load function
async function load() {
  state.file = null
  state.expandedContent = null
  state.file_count = store.file_count || 0
  if(store.skip >= 0) state.skip = store.skip + 1
  else state.skip = 1

  try {
    var f = await web.getNodeFile(store.file['@rid'])
    state.file = await web.getDocInfo(store.file['@rid'])
    state.entities = await web.getEntities()
    
    determineContentType(f)
    
    var nodepath = await web.getNodePath(store.file['@rid'])
    state.nodepath = nodepath
  } catch (error) {
    console.error('Error loading content:', error)
  }
}

// Refresh function
async function refreshContent() {
  await load()
}

// Lifecycle
onMounted(async() => {
  window.addEventListener("keydown", handleKeyDown)
  window.addEventListener("keyup", handleKeyUp)
  await load()
})

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown)
  window.removeEventListener("keyup", handleKeyUp)
})
</script>

<style scoped>
.multidisplay-container {
  max-width: 100% !important;
  margin-left: 60px !important;
}

.left-column {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  height: calc(100vh - 64px);
  overflow-y: auto;
  transition: all 0.3s ease;
  background: rgba(0, 0, 0, 0.02);
}

.left-column.collapsed {
  width: 0 !important;
  min-width: 0 !important;
  max-width: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
  overflow: hidden;
}

.center-column {
  height: calc(100vh - 64px);
  overflow-y: auto;
  background: white;
}

.toggle-button {
  opacity: 1 !important;
  transition: opacity 0.2s ease;
  background-color: rgba(25, 118, 210, 0.1) !important;
  border: 1px solid rgba(25, 118, 210, 0.3) !important;
}

.toggle-button:hover {
  opacity: 1 !important;
  background-color: rgba(25, 118, 210, 0.2) !important;
}

.main-content {
  background-color: white;
  min-height: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.toolbar {
  background: rgba(255, 255, 255, 0.9);
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

.main-image {
  max-width: 100%;
  max-height: calc(100vh - 200px);
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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

.responsive-image {
  max-width: 100%;
  object-fit: contain;
}

.content-wrapper {
  position: relative;
  display: inline-block;
}

.expanded-content-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 100px);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
}

.expanded-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.1s ease;
  transform-origin: center center;
  will-change: transform;
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.expanded-text {
  max-width: 100%;
  max-height: 100%;
  overflow: auto;
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.1s ease;
  transform-origin: center center;
  will-change: transform;
}

.expanded-text pre {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.4;
  color: #333;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.close-expanded-content {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1000;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .left-column {
    border-right: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    height: auto;
    max-height: 40vh;
  }
  
  .left-column.collapsed {
    max-height: 0;
    border-bottom: none;
  }
  
  .center-column {
    height: calc(60vh - 64px);
  }
  
  .right-column {
    border-left: none;
    border-top: 1px solid rgba(0, 0, 0, 0.12);
    height: auto;
    max-height: 40vh;
  }
}
</style>
