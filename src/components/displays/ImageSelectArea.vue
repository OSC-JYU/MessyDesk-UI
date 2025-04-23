<template>
  <div class="image-select-area">
    <div class="image-container" ref="imageContainer" @mousedown="startRegionCreation" @mousemove="handleRegionCreation" @mouseup="finishRegionCreation" @mouseleave="finishRegionCreation">
      <img 
        ref="image"
        :src="imageUrl" 
        @load="onImageLoad"
        draggable="false"
      />
      
      <!-- Render locked regions first -->
      <div v-for="(area, index) in lockedAreas" :key="'locked-' + index"
           class="region locked-region"
           :style="{
             left: area.x + 'px',
             top: area.y + 'px',
             width: area.width + 'px',
             height: area.height + 'px'
           }">
        <div class="region-label">{{ area.label }}</div>
      </div>

      <!-- Render editable regions -->
      <div v-for="(area, index) in editableAreas" :key="index"
           class="region"
           :style="{
             left: area.x + 'px',
             top: area.y + 'px',
             width: area.width + 'px',
             height: area.height + 'px',
             border: `${borderWidth}px solid ${borderColor}`,
             zIndex: currentAreaIndex === index ? 1000 : 1
           }"
           @mousedown.stop="startDragging($event, index)">
        <div class="resize-handle top-left" @mousedown.stop="startResizing($event, index, 'top-left')"></div>
        <div class="resize-handle top-right" @mousedown.stop="startResizing($event, index, 'top-right')"></div>
        <div class="resize-handle bottom-left" @mousedown.stop="startResizing($event, index, 'bottom-left')"></div>
        <div class="resize-handle bottom-right" @mousedown.stop="startResizing($event, index, 'bottom-right')"></div>
        <div class="label-container">
          <input
            v-model="area.label"
            class="area-label"
            placeholder="Enter label"
            @click.stop
            @mousedown.stop
            @change="updateAreaLabel(index)"
          />
        </div>
        <div class="region-label">{{ area.label }}</div>
        <button class="delete-button" @click.stop="deleteRegion(area)">
          <v-icon icon="mdi-close"></v-icon>
        </button>
      </div>

      <!-- Current region being created -->
      <div v-if="currentRegion" class="region"
           :style="{
             left: currentRegion.x + 'px',
             top: currentRegion.y + 'px',
             width: currentRegion.width + 'px',
             height: currentRegion.height + 'px'
           }">
        <div class="region-label">{{ currentRegion.label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';

const props = defineProps({
  imageUrl: String,
  width: Number,
  height: Number,
  borderColor: {
    type: String,
    default: 'green'
  },
  borderWidth: {
    type: Number,
    default: 2
  },
  initAreas: {
    type: Array,
    default: () => []
  },
  newRegion: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['save-data']);

const imageContainer = ref(null);
const image = ref(null);
const areas = ref([]);
const isDragging = ref(false);
const isResizing = ref(false);
const currentAreaIndex = ref(null);
const resizeDirection = ref(null);
const startX = ref(0);
const startY = ref(0);
const isCreatingRegion = ref(false);
const startRegionX = ref(0);
const startRegionY = ref(0);
const currentRegion = ref(null);

const lockedAreas = ref([]);
const editableAreas = ref([]);

// Watch for new region prop changes
watch(() => props.newRegion, (newRegion) => {
  if (newRegion && image.value) {
    const pixelRegion = {
      x: percentageToPixels(newRegion.left, image.value.width),
      y: percentageToPixels(newRegion.top, image.value.height),
      width: percentageToPixels(newRegion.width, image.value.width),
      height: percentageToPixels(newRegion.height, image.value.height),
      label: newRegion.label || `Region ${editableAreas.value.length + 1}`,
      '@rid': newRegion['@rid'],
      locked: newRegion.locked || false
    };
    
    if (pixelRegion.locked) {
      lockedAreas.value.push(pixelRegion);
    } else {
      editableAreas.value.push(pixelRegion);
    }
    
    emit('save-data', getAreasAsPercentages());
  }
});

// Convert percentage coordinates to pixels
const percentageToPixels = (percentage, dimension) => {
  return (percentage / 100) * dimension;
};

// Convert pixel coordinates to percentage
const pixelsToPercentage = (pixels, dimension) => {
  return (pixels / dimension) * 100;
};

const onImageLoad = () => {
  if (props.initAreas && props.initAreas.length > 0) {
    // Split areas into locked and editable
    const locked = [];
    const editable = [];
    
    props.initAreas.forEach(area => {
      const pixelRegion = {
        x: percentageToPixels(area.left, image.value.width),
        y: percentageToPixels(area.top, image.value.height),
        width: percentageToPixels(area.width, image.value.width),
        height: percentageToPixels(area.height, image.value.height),
        label: area.label || '',
        '@rid': area['@rid'],
        locked: area.locked || false
      };
      
      if (pixelRegion.locked) {
        locked.push(pixelRegion);
      } else {
        editable.push(pixelRegion);
      }
    });
    
    lockedAreas.value = locked;
    editableAreas.value = editable;
  }
};

const startRegionCreation = (event) => {
  if (event.target.tagName === 'IMG') {
    isCreatingRegion.value = true;
    const rect = event.target.getBoundingClientRect();
    startRegionX.value = event.clientX - rect.left;
    startRegionY.value = event.clientY - rect.top;
    
    // Initialize currentRegion but don't add it to areas yet
    currentRegion.value = {
      x: startRegionX.value,
      y: startRegionY.value,
      width: 0,
      height: 0,
      label: `Region ${editableAreas.value.length + 1}`,
      '@rid': null,
      locked: false
    };
  }
};

const handleRegionCreation = (event) => {
  if (!isCreatingRegion.value || !currentRegion.value) return;
  
  const rect = event.target.getBoundingClientRect();
  const currentX = event.clientX - rect.left;
  const currentY = event.clientY - rect.top;
  
  // Calculate width and height based on drag direction
  const width = currentX - startRegionX.value;
  const height = currentY - startRegionY.value;
  
  // Update region dimensions
  currentRegion.value.width = Math.abs(width);
  currentRegion.value.height = Math.abs(height);
  
  // Update position based on drag direction
  if (width < 0) {
    currentRegion.value.x = currentX;
  } else {
    currentRegion.value.x = startRegionX.value;
  }
  
  if (height < 0) {
    currentRegion.value.y = currentY;
  } else {
    currentRegion.value.y = startRegionY.value;
  }
};

const finishRegionCreation = () => {
  if (isCreatingRegion.value && currentRegion.value) {
    // Only add to areas if minimum size is reached
    if (currentRegion.value.width >= 20 && currentRegion.value.height >= 20) {
      editableAreas.value.push(currentRegion.value);
      emit('save-data', getAreasAsPercentages());
    }
    
    isCreatingRegion.value = false;
    currentRegion.value = null;
  }
};

const startDragging = (event, index) => {
  event.preventDefault();
  isDragging.value = true;
  currentAreaIndex.value = index;
  
  const rect = imageContainer.value.getBoundingClientRect();
  startX.value = event.clientX - rect.left - editableAreas.value[index].x;
  startY.value = event.clientY - rect.top - editableAreas.value[index].y;
};

const onDrag = (event) => {
  if (!isDragging.value || currentAreaIndex.value === null) return;
  
  const rect = imageContainer.value.getBoundingClientRect();
  const newX = event.clientX - rect.left - startX.value;
  const newY = event.clientY - rect.top - startY.value;
  
  // Keep area within image bounds
  const area = editableAreas.value[currentAreaIndex.value];
  area.x = Math.max(0, Math.min(newX, image.value.width - area.width));
  area.y = Math.max(0, Math.min(newY, image.value.height - area.height));
  
  emit('save-data', getAreasAsPercentages());
};

const stopDragging = () => {
  isDragging.value = false;
  currentAreaIndex.value = null;
};

const startResizing = (event, index, direction) => {
  event.preventDefault();
  event.stopPropagation();
  isResizing.value = true;
  currentAreaIndex.value = index;
  resizeDirection.value = direction;
  startX.value = event.clientX;
  startY.value = event.clientY;
  
  // Move the area to the top of the stack
  const area = editableAreas.value.splice(index, 1)[0];
  editableAreas.value.push(area);
  currentAreaIndex.value = editableAreas.value.length - 1;
};

const onResize = (event) => {
  if (!isResizing.value || currentAreaIndex.value === null) return;
  
  const area = editableAreas.value[currentAreaIndex.value];
  const deltaX = event.clientX - startX.value;
  const deltaY = event.clientY - startY.value;
  
  switch (resizeDirection.value) {
    case 'top-left':
      area.x = Math.max(0, Math.min(area.x + deltaX, area.x + area.width - 20));
      area.y = Math.max(0, Math.min(area.y + deltaY, area.y + area.height - 20));
      area.width = Math.max(20, area.width - deltaX);
      area.height = Math.max(20, area.height - deltaY);
      break;
    case 'top-right':
      area.y = Math.max(0, Math.min(area.y + deltaY, area.y + area.height - 20));
      area.width = Math.max(20, Math.min(area.width + deltaX, image.value.width - area.x));
      area.height = Math.max(20, area.height - deltaY);
      break;
    case 'bottom-left':
      area.x = Math.max(0, Math.min(area.x + deltaX, area.x + area.width - 20));
      area.width = Math.max(20, area.width - deltaX);
      area.height = Math.max(20, Math.min(area.height + deltaY, image.value.height - area.y));
      break;
    case 'bottom-right':
      area.width = Math.max(20, Math.min(area.width + deltaX, image.value.width - area.x));
      area.height = Math.max(20, Math.min(area.height + deltaY, image.value.height - area.y));
      break;
  }
  
  startX.value = event.clientX;
  startY.value = event.clientY;
  
  emit('save-data', getAreasAsPercentages());
};

const stopResizing = () => {
  isResizing.value = false;
  currentAreaIndex.value = null;
  resizeDirection.value = null;
};

const updateAreaLabel = (index) => {
  emit('save-data', getAreasAsPercentages());
};

const getAreasAsPercentages = () => {
  const allAreas = [...lockedAreas.value, ...editableAreas.value];
  return allAreas.map(area => ({
    left: pixelsToPercentage(area.x, image.value.width),
    top: pixelsToPercentage(area.y, image.value.height),
    width: pixelsToPercentage(area.width, image.value.width),
    height: pixelsToPercentage(area.height, image.value.height),
    label: area.label,
    '@rid': area['@rid'],
    locked: area.locked
  }));
};

const deleteRegion = (area) => {
  const index = editableAreas.value.indexOf(area);
  if (index !== -1) {
    editableAreas.value.splice(index, 1);
    emit('save-data', getAreasAsPercentages());
  }
};

onMounted(() => {
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mousemove', onResize);
  window.addEventListener('mouseup', stopDragging);
  window.addEventListener('mouseup', stopResizing);
  window.addEventListener('mouseup', finishRegionCreation);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mousemove', onResize);
  window.removeEventListener('mouseup', stopDragging);
  window.removeEventListener('mouseup', stopResizing);
  window.removeEventListener('mouseup', finishRegionCreation);
});
</script>

<style scoped>
.image-select-area {
  position: relative;
  display: inline-block;
}

.image-container {
  position: relative;
  display: inline-block;
}

.image-container img {
  max-width: 100%;
  height: auto;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
}

.select-area {
  position: absolute;
  cursor: move;
  background-color: rgba(255, 255, 255, 0.1);
  user-select: none;
  transition: z-index 0.1s;
}

.resize-handle {
  position: absolute;
  width: 16px;
  height: 16px;
  background-color: white;
  border: 2px solid #000;
  z-index: 1001;
}

.top-left {
  top: -8px;
  left: -8px;
  cursor: nw-resize;
}

.top-right {
  top: -8px;
  right: -8px;
  cursor: ne-resize;
}

.bottom-left {
  bottom: -8px;
  left: -8px;
  cursor: sw-resize;
}

.bottom-right {
  bottom: -8px;
  right: -8px;
  cursor: se-resize;
}

.label-container {
  position: absolute;
  top: -30px;
  left: 0;
  z-index: 1002;
  pointer-events: auto;
}

.area-label {
  background: white;
  border: 1px solid #ccc;
  padding: 4px 8px;
  font-size: 12px;
  min-width: 100px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  pointer-events: auto;
}

.area-label:focus {
  outline: none;
  border-color: #2196F3;
  box-shadow: 0 0 0 2px rgba(33,150,243,0.2);
}

.delete-button {
  position: absolute;
  top: -12px;
  right: -12px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: white;
  border: 2px solid #ff4444;
  color: #ff4444;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1003;
  padding: 0;
  transition: all 0.2s ease;
}

.delete-button:hover {
  background-color: #ff4444;
  color: white;
}

.delete-button:active {
  transform: scale(0.9);
}

.region {
  position: absolute;
  background-color: rgba(255, 255, 255, 0.1);
  cursor: move;
  user-select: none;
  transition: z-index 0.1s;
}

.locked-region {
  border-color: red;
  cursor: not-allowed;
  background-color: rgba(255, 0, 0, 0.1);
  pointer-events: none;
}

.region-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  color: white;
}
</style> 