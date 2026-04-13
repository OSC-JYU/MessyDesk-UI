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
        <img v-if="state.file && state.file.path" 
          :src="thumbnailUrl(state.file.path)" 
          class="main-image" 
          :style="{ transform: `rotate(${state.imageRotation}deg)` }"
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
  </v-container>

</template>

<script setup>
import { onMounted, onUnmounted, reactive, ref, watch } from "vue";
import web from "../../web.js";
import {store} from "../../components/Store.js";

const apiUrl = import.meta.env.VITE_API_PATH
const contentContainer = ref(null)

const emit = defineEmits(['change-tab'])
const props = defineProps(['tab'])

watch(() => props.tab, async () => {
  await load()
})

// Also reload when store.file changes (e.g. from wrapper navigation)
watch(() => store.file, async (newFile) => {
  if (newFile) await load()
})

var state = reactive({
  file: null,
  content: '',
  contentType: 'text',
  imageRotation: 0,
  thumbnailVersion: Date.now(),
})

function thumbnailUrl(filePath) {
  if(!filePath) return ''
  return `${apiUrl}/api/thumbnails/${filePath}?v=${state.thumbnailVersion}`
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
  state.imageRotation = 0

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
</style>
