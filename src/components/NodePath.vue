<template>
  <div class="node-path-container">
    <template v-for="(node, index) in nodepath" :key="node['@rid'] || index">
      <div v-if="node['@type'] !== 'User'" class="node-path-item">
        <!-- Arrow separator (except for first item) -->
        <v-icon 
          v-if="index > 0" 
          size="16" 
          color="grey-lighten-1" 
          class="path-separator"
        >
          mdi-chevron-left
        </v-icon>
        
        <!-- Node content -->
        <div :class="getNodeClasses(node)" >
          <!-- Node icon based on type -->
          <v-icon 
            :icon="getNodeIcon(node)" 
            size="16" 
            :color="getNodeColor(node)"
            class="node-icon"
          ></v-icon>
          
          <!-- Node label -->
          <span class="node-label">{{ node.label }} </span>
          
          <!-- Node image thumbnail (if applicable) -->
          <img 
            v-if="node.type === 'image' && node.path" 
            :src="apiUrl + '/api/thumbnails/' + node.path" 
            class="node-thumbnail" 
            @click="handleImageClick(node.path)"
            alt="Node thumbnail" 
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  nodepath: {
    type: Array,
    default: () => []
  },
  apiUrl: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['image-click'])

// Computed properties for styling
const getNodeClasses = (node) => {
  const baseClasses = []
  if (node.type) {
    baseClasses.push(`vue-flow__node-${node.type}`)
  } else if (node['@type']) {
    baseClasses.push(`vue-flow__node-${node['@type'].toLowerCase()}`)
  }
  

  
  return baseClasses.join(' ')
}

const getNodeIcon = (node) => {
  // Map node types to appropriate icons
  const iconMap = {
    'Project': 'mdi-folder',
    'Set': 'mdi-folder-multiple',
    'Source': 'mdi-database',
    'Process': 'mdi-cog',
    'Text': 'mdi-file-document',
    'Image': 'mdi-image',
    'PDF': 'mdi-file-pdf-box',
    'JSON': 'mdi-code-json',
    'OCR': 'mdi-text-recognition',
    'NER': 'mdi-tag',
    'Human': 'mdi-account',
    'Consumer': 'mdi-arrow-right-bold'
  }
  
  return iconMap[node['@type']] || iconMap[node.type] || 'mdi-file'
}

const getNodeColor = (node) => {
  // Map node types to colors
  const colorMap = {
    'Project': 'blue',
    'Set': 'green',
    'Source': 'orange',
    'Process': 'purple',
    'Text': 'grey',
    'Image': 'pink',
    'PDF': 'red',
    'JSON': 'amber',
    'OCR': 'teal',
    'NER': 'indigo',
    'Human': 'brown',
    'Consumer': 'cyan'
  }
  
  return colorMap[node['@type']] || colorMap[node.type] || 'grey'
}

const handleImageClick = (imagePath) => {
  emit('image-click', imagePath)
}
</script>

<style scoped>
.node-path-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.node-path-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.path-separator {
  margin: 0 2px;
  opacity: 0.6;
}

.node-base {

}

.node-base:hover {
  background: rgba(255, 255, 255, 1);
  border-color: rgba(0, 0, 0, 0.2);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.node-icon {
  flex-shrink: 0;
}

.node-label {
  font-size: 14px;

  white-space: nowrap;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-thumbnail {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.node-thumbnail:hover {
  transform: scale(1.1);
  border-color: rgba(0, 0, 0, 0.3);
}

/* Type-specific styling */
.vue-flow__node-project  {

}

.vue-flow__node-set {

}

.node-type-source {
  background: rgba(255, 152, 0, 0.1);
  border-color: rgba(255, 152, 0, 0.3);
  color: red;
}

.vue-flow__node-process  {
  color: white !important;
  min-width: 200px;
}

.vue-flow__node-text  {
  min-width: 200px;
}

.vue-flow__node-image  {
  background: rgba(233, 30, 99, 0.1);
  border-color: rgba(233, 30, 99, 0.3);
}

.node-type-pdf {
  background: rgba(244, 67, 54, 0.1);
  border-color: rgba(244, 67, 54, 0.3);
}

.node-type-json {
  background: rgba(255, 193, 7, 0.1);
  border-color: rgba(255, 193, 7, 0.3);
}

.node-type-ocr {
  background: rgba(0, 150, 136, 0.1);
  border-color: rgba(0, 150, 136, 0.3);
}

.node-type-ner {
  background: rgba(63, 81, 181, 0.1);
  border-color: rgba(63, 81, 181, 0.3);
}

.node-type-human {
  background: rgba(121, 85, 72, 0.1);
  border-color: rgba(121, 85, 72, 0.3);
}

.node-type-consumer {
  background: rgba(0, 188, 212, 0.1);
  border-color: rgba(0, 188, 212, 0.3);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .node-path-container {
    padding: 6px;
    gap: 2px;
  }
  
  .node-base {
    padding: 4px 8px;
    gap: 4px;
  }
  
  .node-label {
    font-size: 12px;
    max-width: 120px;
  }
  
  .node-thumbnail {
    width: 40px;
    height: 40px;
  }
}
</style>
