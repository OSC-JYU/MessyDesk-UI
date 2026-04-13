<template>
  <v-sheet class="path-panel" :class="{ 'collapsed': collapsed }">
    <!-- Header with collapse toggle -->
    <div class="path-header d-flex align-center" :class="{ 'justify-center': collapsed, 'justify-space-between': !collapsed }">
      <span v-if="!collapsed" class="text-overline text-medium-emphasis">Lineage</span>
      <v-btn icon size="x-small" variant="text" @click="$emit('toggle-collapse')">
        <v-icon size="16">{{ collapsed ? 'mdi-chevron-right' : 'mdi-chevron-left' }}</v-icon>
      </v-btn>
    </div>

    <div v-if="!collapsed" class="path-body">
      <!-- Vertical ancestry tree -->
      <div v-if="nodepath.length" class="ancestors">
        <template v-for="(node, index) in visibleNodes" :key="node['@rid'] || index">
          <div class="ancestor-item" :class="{ 'is-current': index === visibleNodes.length - 1 }">
            <!-- Connector line -->
            <div class="connector-col">
              <div v-if="index > 0" class="connector-line"></div>
              <div class="connector-dot" :style="{ background: getColor(node) }"></div>
              <div v-if="index < visibleNodes.length - 1" class="connector-line connector-line-below"></div>
            </div>

            <!-- Node content -->
            <div class="node-content" @click="$emit('ancestor-click', node)">
              <div class="node-header">
                <v-icon :icon="getIcon(node)" size="14" :color="getColor(node)" class="mr-1"></v-icon>
                <span class="node-type-badge">{{ getTypeLabel(node) }}</span>
              </div>
              <div class="node-label" :title="node.label">{{ node.label }}</div>
              <!-- Thumbnail for images -->
              <img 
                v-if="hasThumb(node)" 
                :src="apiUrl + '/api/thumbnails/' + node.path" 
                class="node-thumb" 
                @click.stop="$emit('image-click', node.path)"
                alt="" 
              />
            </div>
          </div>
        </template>
      </div>
      <div v-else class="pa-3 text-caption text-medium-emphasis text-center">
        No lineage data
      </div>
    </div>
  </v-sheet>
</template>

<script setup>
import { watch, ref, computed } from 'vue'
import web from '../../web.js'

const apiUrl = import.meta.env.VITE_API_PATH

const props = defineProps({
  fileRid: { type: String, default: null },
  collapsed: { type: Boolean, default: false }
})

defineEmits(['toggle-collapse', 'image-click', 'ancestor-click'])

const nodepath = ref([])

// Filter out User nodes
const visibleNodes = computed(() => {
  return nodepath.value.filter(n => n['@type'] !== 'User')
})

watch(() => props.fileRid, async (rid) => {
  if (rid) {
    nodepath.value = await web.getNodePath(rid)
  } else {
    nodepath.value = []
  }
}, { immediate: true })

function getIcon(node) {
  const map = {
    'Project': 'mdi-folder-outline',
    'Set': 'mdi-folder-multiple-outline',
    'Source': 'mdi-database-outline',
    'Process': 'mdi-cog-outline',
    'File': 'mdi-file-outline',
  }
  const typeMap = {
    'image': 'mdi-image-outline',
    'pdf': 'mdi-file-pdf-box',
    'text': 'mdi-file-document-outline',
  }
  if (node.type && typeMap[node.type]) return typeMap[node.type]
  return map[node['@type']] || 'mdi-file-outline'
}

function getColor(node) {
  const map = {
    'Project': '#1976D2',
    'Set': '#2E7D32',
    'Source': '#E65100',
    'Process': '#7B1FA2',
  }
  const typeMap = {
    'image': '#AD1457',
    'pdf': '#C62828',
    'text': '#546E7A',
  }
  if (node.type && typeMap[node.type]) return typeMap[node.type]
  return map[node['@type']] || '#757575'
}

function getTypeLabel(node) {
  if (node['@type'] === 'File' && node.type) return node.type
  return (node['@type'] || '').toLowerCase()
}

function hasThumb(node) {
  return node.type === 'image' && node.path
}
</script>

<style scoped>
.path-panel {
  height: calc(100vh - 64px);
  overflow-y: auto;
  background: #fafbfc;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  transition: width 0.2s ease;
}

.path-panel.collapsed {
  width: 36px !important;
  min-width: 36px !important;
  max-width: 36px !important;
  overflow: hidden;
}

.path-header {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.path-body {
  padding: 12px 8px 12px 4px;
}

/* Vertical tree */
.ancestor-item {
  display: flex;
  align-items: stretch;
  min-height: 40px;
}

.connector-col {
  width: 24px;
  min-width: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.connector-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  z-index: 1;
}

.is-current .connector-dot {
  width: 10px;
  height: 10px;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.2);
}

.connector-line,
.connector-line-below {
  width: 2px;
  flex: 1;
  background: rgba(0, 0, 0, 0.1);
}

.node-content {
  flex: 1;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
  margin-bottom: 2px;
}

.node-content:hover {
  background: rgba(0, 0, 0, 0.04);
}

.is-current .node-content {
  background: rgba(25, 118, 210, 0.06);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 2px;
}

.node-type-badge {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(0, 0, 0, 0.45);
  font-weight: 600;
}

.node-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
  line-height: 1.3;
}

.node-thumb {
  display: block;
  width: 100%;
  max-width: 120px;
  border-radius: 4px;
  margin-top: 4px;
  object-fit: cover;
  border: 1px solid rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: opacity 0.15s;
}

.node-thumb:hover {
  opacity: 0.85;
}
</style>
