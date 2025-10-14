<template>
  <v-card
    v-if="isVisible"
    class="debug-floating-window"
    elevation="8"
    :style="windowStyle"
  >
    <!-- Header -->
    <v-card-title 
      class="debug-header pa-2"
      @mousedown="startDrag"
    >
      <div class="d-flex align-center">
        <v-icon icon="mdi-bug" size="small" class="mr-2"></v-icon>
        <span class="text-subtitle-2">UI Debug Panel</span>
        <v-spacer></v-spacer>
        <v-btn
          @click.stop="toggleVisibility"
          size="x-small"
          variant="text"
          icon="mdi-close"
          color="white"
        ></v-btn>
      </div>
    </v-card-title>

    <!-- Content -->
    <v-card-text class="pa-3">
      <div class="debug-content">
        <!-- Current Node Info -->
        <div v-if="currentNode" class="mb-3">
          <v-label class="text-caption text-medium-emphasis mb-1 d-block">Current Node:</v-label>
          <v-chip size="small" variant="tonal" class="mr-1">
            {{ currentNode.data?.type || 'unknown' }}
          </v-chip>
          <span class="text-caption">{{ currentNode.label || 'No label' }}</span>
        </div>

        <!-- Debug Buttons -->

        <div class="debug-buttons">
          <v-btn
            @click.stop="createProcess"
            color="primary"
            variant="flat"
            size="small"
            block
            class="mb-2"
            :disabled="!canCreateProcess"
          >
            <v-icon start icon="mdi-cog" size="small"></v-icon>
            Create Process
          </v-btn>

          <v-btn 
            @click.stop="processRunning"
            color="secondary"
            variant="flat"
            size="small"
            block
            class="mb-2"
            :disabled="!canCreateProcessFinished"
          >
            <v-icon start icon="mdi-cog-pause" size="small"></v-icon>
            Process Running
          </v-btn>

          <v-btn 
            @click.stop="processAddFile"
            color="success"
            variant="flat"
            size="small"
            block
            class="mb-2"
            :disabled="!canCreateProcessFinished"
          >
            <v-icon start icon="mdi-cog-stop" size="small"></v-icon>
            Process Add File
          </v-btn>

          <v-btn 
            @click.stop="processFinished"
            color="success"
            variant="flat"
            size="small"
            block
            class="mb-2"
            :disabled="!canCreateProcessFinished"
          >
            <v-icon start icon="mdi-cog-stop" size="small"></v-icon>
            Process Finished
          </v-btn>

          Set
          <v-divider class="mb-2"></v-divider>

          <v-btn
            @click.stop="createSet"
            color="primary"
            variant="flat"
            size="small"
            block
            class="mb-2"
            :disabled="!canCreateSet"
          >
            <v-icon start icon="mdi-folder-multiple" size="small"></v-icon>
            Create Set
          </v-btn>

          <v-btn
            @click.stop="createSetProcess"
            color="secondary"
            variant="flat"
            size="small"
            block
            class="mb-2"
            :disabled="!canCreateSetProcess"
          >
            <v-icon start icon="mdi-folder-multiple" size="small"></v-icon>
            Create Set Process
          </v-btn>

          <v-btn 
            @click.stop="addProcessedFileToSet"
            color="success"
            variant="flat"
            size="small"
            block
            class="mb-2"
            :disabled="!canAddProcessedFileToSet"
          >
            <v-icon start icon="mdi-image-outline" size="small"></v-icon>
            Add processed file to set
          </v-btn>
          <v-btn 
            @click.stop="setProcessFinished"
            color="success"
            variant="flat"
            size="small"
            block
            class="mb-2"
            :disabled="!canCreateSetProcessFinished"
          >
            <v-icon start icon="mdi-folder-multiple" size="small"></v-icon>
            Set Process Finished
          </v-btn>

          <v-btn
            @click.stop="refreshData"
            color="info"
            variant="outlined"
            size="small"
            block
            class="mb-2"
          >
            <v-icon start icon="mdi-refresh" size="small"></v-icon>
            Refresh Data
          </v-btn>

          <v-btn
            @click.stop="toggleDebugInfo"
            color="warning"
            variant="outlined"
            size="small"
            block
          >
            <v-icon start icon="mdi-information" size="small"></v-icon>
            {{ showDebugInfo ? 'Hide' : 'Show' }} Debug Info
          </v-btn>
        </div>

        <!-- Debug Information -->
        <v-expand-transition>
          <div v-if="showDebugInfo" class="debug-info mt-3">
            <v-divider class="mb-2"></v-divider>
            <v-label class="text-caption text-medium-emphasis mb-2 d-block">Debug Information:</v-label>
            
            <div class="debug-info-content">
              <div class="mb-2">
                <strong>Node ID:</strong> {{ currentNode?.id || 'None' }}
              </div>
              <div class="mb-2">
                <strong>Node Type:</strong> {{ currentNode?.data?.type || 'None' }}
                <strong>Node Type:</strong> {{ currentNode?.type || 'None' }}
              </div>
              <div class="mb-2">
                <strong>Node Label:</strong> {{ currentNode?.label || 'None' }}
              </div>
              <div class="mb-2">
                <strong>Selected Collections:</strong> {{ selectedCollectionsCount }}
              </div>
              <div class="mb-2">
                <strong>Search Criteria:</strong> {{ searchCriteriaCount }}
              </div>
              <div class="mb-2">
                <strong>Timestamp:</strong> {{ currentTimestamp }}
              </div>
            </div>
            <v-btn
              href="http://localhost:4646/ui/jobs"
              target="_blank"
              color="info"
              variant="outlined"
              size="small"
              block
              class="mb-2"
            >
              <v-icon start icon="mdi-open-in-new" size="small"></v-icon>
              Nomad UI
            </v-btn>
            <v-btn
              href="http://localhost:2480"
              target="_blank" 
              color="info"
              variant="outlined"
              size="small"
              block
            >
              <v-icon start icon="mdi-open-in-new" size="small"></v-icon>
              ArcadeDB
            </v-btn>
          </div>

        </v-expand-transition>
      </div>
    </v-card-text>
  </v-card>

  <!-- Toggle Button (when window is hidden) -->
  <v-btn
    v-if="!isVisible"
    @click="toggleVisibility"
    class="debug-toggle-btn"
    color="primary"
    variant="fab"
    size="small"
    icon="mdi-bug"
  ></v-btn>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { store } from './Store.js'

// Props
const props = defineProps({
  selectedCollections: {
    type: Array,
    default: () => []
  },
  searchCriteria: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits([
  'create-process',
  'create-set',
  'refresh-data'
])

// Reactive state
const isVisible = ref(false)
const showDebugInfo = ref(false)
const windowPosition = ref({ x: 20, y: 70 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

// Computed properties
const currentNode = computed(() => store.current_node)

const canCreateProcess = computed(() => {
  return currentNode.value && 
         (currentNode.value.data?.type === 'source' || 
          currentNode.value.data?.type === 'file')
})

const canCreateSetProcess = computed(() => {
  return currentNode.value && 
         currentNode.value.data?.type === 'set'
})

const canAddProcessedFileToSet = computed(() => {
  return currentNode.value && 
         currentNode.value.data?.type === 'process'
})

  const canCreateSet = computed(() => {
    return true
  })

const canCreateProcessFinished = computed(() => {
  return currentNode.value && 
         currentNode.value.data?.type === 'process'
})

const canCreateSetProcessFinished = computed(() => {
  return currentNode.value && 
         currentNode.value.data?.type === 'process'
})

const selectedCollectionsCount = computed(() => {
  return props.selectedCollections?.length || 0
})

const searchCriteriaCount = computed(() => {
  return props.searchCriteria?.length || 0
})

const currentTimestamp = computed(() => {
  return new Date().toLocaleTimeString()
})

var current_file = 1

const windowStyle = computed(() => ({
  position: 'fixed',
  left: `${windowPosition.value.x}px`,
  top: `${windowPosition.value.y}px`,
  zIndex: 9999,
  minWidth: '280px',
  maxWidth: '320px'
}))

// Methods
const toggleVisibility = () => {
  isVisible.value = !isVisible.value
}

const toggleDebugInfo = () => {
  showDebugInfo.value = !showDebugInfo.value
}

const createProcess = async () => {
  var rid = '#' + Math.floor(Math.random() * 1000).toString()
  await fetch(`/events/test/message`, {
    method: 'POST',   
    body: JSON.stringify({
      command: 'add',
      type: 'process',
      input: currentNode.value?.id,
      node: { "@rid": rid, "@type": 'process', label: 'Test Process', "description": `Test Process ${rid}`, status: 'running' }
    })
  })
  console.log('Process created')
}

const processRunning = async () => {
  await fetch(`/events/test/message`, {
    method: 'POST',   
    body: JSON.stringify({
      command: 'process_update',
      process: { "@rid": currentNode.value?.id, "@type": 'process', status: 'running' }
    })
  })
  console.log('Process running')
}


const processFinished = async () => {
  await fetch(`/events/test/message`, {
    method: 'POST',   
    body: JSON.stringify({
      command: 'process_finished',
      process: { '@rid': currentNode.value?.id, status: 'finished' }
    })
  })
  console.log('Process finished')
}

const processAddFile = async () => {
  await fetch(`/events/test/message`, {
    method: 'POST',   
    body: JSON.stringify({
      command: 'add',
      type: 'text',
      input: currentNode.value?.id,
      node: { "@rid": currentNode.value?.id + '_file', "@type": 'file', label: 'Test File', "description": `Test File ${currentNode.value?.id}`, status: 'running' },
      process: { "@rid": currentNode.value?.id, "@type": 'process', status: 'finished' }
    })
  })
  console.log('Process add file')
}



const createSetProcess = async () => {
  var rid = '#' + Math.floor(Math.random() * 1000).toString()
  await fetch(`/events/test/message`, {
    method: 'POST',   
    body: JSON.stringify({
      command: 'add',
      type: 'process',
      input: currentNode.value?.id,
      node: { "@rid": rid, "@type": 'process', label: 'Test Process', "description": `Test Process ${rid}`, status: 'running' },
      output: { "@rid": rid + '_output', "@type": 'set', label: 'Test set', "description": `Test set ${rid}`, status: 'running', count: 0 }
    })
  })
  console.log('Process created')
}

// aka process_update
const addProcessedFileToSet = async () => {

  await fetch(`/events/test/message`, {
    method: 'POST',   
    body: JSON.stringify({
      command: 'process_update',
      total_files: 10,
      process: { "@rid": currentNode.value?.id, status: 'running' },
      set: { "@rid": currentNode.value?.id + '_output', status: 'running', count: current_file++ }
    })
  })
}

const setProcessFinished = async () => {
  await fetch(`/events/test/message`, {
    method: 'POST',   
    body: JSON.stringify({
      command: 'process_finished',
      process: {'@rid': currentNode.value?.id, '@type': 'process', status: 'finished', duration: '00:23:45' },
      set: { "@rid": currentNode.value?.id + '_output', "@type": 'set', status: 'finished', label: 'Ready to crunch' }
    })
  })
  console.log('Process finished')
}

const createSet = async () => {
  var rid = '#' + Math.floor(Math.random() * 1000).toString()
  await fetch(`/events/test/message`, {
    method: 'POST',   
    body: JSON.stringify({
      command: 'add',
      type: 'set',
      node: { "@rid": rid, "@type": 'set', label: 'Test Set', "description": `Test Set ${rid}`, status: 'running' }
    })
  })
  console.log('Set created')
}




const refreshData = () => {
  emit('refresh-data', {
    timestamp: new Date().toISOString()
  })
}

// Drag functionality
const startDrag = (event) => {
  if (event.target.closest('.debug-buttons') || event.target.closest('.debug-info')) {
    return // Don't drag if clicking on buttons or debug info
  }
  
  isDragging.value = true
  dragStart.value = {
    x: event.clientX - windowPosition.value.x,
    y: event.clientY - windowPosition.value.y
  }
  
  event.preventDefault()
}

const onDrag = (event) => {
  if (!isDragging.value) return
  
  windowPosition.value = {
    x: event.clientX - dragStart.value.x,
    y: event.clientY - dragStart.value.y
  }
}

const stopDrag = () => {
  isDragging.value = false
}

// Keyboard shortcuts
const handleKeydown = (event) => {
  // Ctrl/Cmd + Shift + D to toggle debug window
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
    event.preventDefault()
    toggleVisibility()
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.debug-floating-window {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  user-select: none;
}

.debug-header {
  background: linear-gradient(135deg, #1976d2, #1565c0);
  color: white;
  cursor: move;
  border-radius: 8px 8px 0 0;
}

.debug-header:hover {
  background: linear-gradient(135deg, #1565c0, #0d47a1);
}

.debug-content {
  max-height: 400px;
  overflow-y: auto;
}

.debug-buttons .v-btn {
  text-transform: none;
  font-weight: 500;
}

.debug-info-content {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-size: 0.75rem;
  line-height: 1.4;
}

.debug-info-content div {
  margin-bottom: 4px;
}

.debug-info-content div:last-child {
  margin-bottom: 0;
}

.debug-toggle-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9998;
}

/* Scrollbar styling for debug content */
.debug-content::-webkit-scrollbar {
  width: 4px;
}

.debug-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.debug-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.debug-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
