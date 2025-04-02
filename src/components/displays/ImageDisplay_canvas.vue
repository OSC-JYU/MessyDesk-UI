<template>
  <div class="canvas-container" @wheel.prevent="zoomImage" @mousedown.middle="startPanning">
    <canvas ref="canvas" @mousedown.left="startSelection" @mouseup="endSelection" @mousemove="updateSelection"></canvas>
    <div v-for="(region, index) in regions" :key="index" class="region-label" :style="regionStyle(region)" 
         @mousedown.left="startDragging(index, $event)">
      <input v-model="region.label" placeholder="Label" />
      <div class="resize-handle" @mousedown.stop.left="startResizing(index, $event, 'bottom-right')"></div>
    </div>
  </div>
  <button @click="saveRegions">Save Regions</button>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';

import web from "../../web.js";
import {store} from "../../components/Store.js";

import DescriptionEditor from './DescriptionEditor.vue'
const apiUrl = import.meta.env.VITE_API_PATH

var state = reactive({
        file: null,
        cruncher: null,
        ROIs: [],
        width: 400,
        height: 400,
        image_loaded: false,
        skip: 0,
        file_count: 0,
        panels: [0,0],
        entities: {},
        isCtrlPressed: false
        
    })


const canvas = ref(null);
const ctx = ref(null);
const image = new Image();
const scale = ref(1);
const offsetX = ref(0);
const offsetY = ref(0);
const regions = reactive([]);
let selecting = false;
let resizing = false;
let dragging = false;
let panning = false;
let activeRegionIndex = null;
let startPanX = 0, startPanY = 0;
let resizeIndex = null;
let resizeDirection = '';
let startX = 0, startY = 0, endX = 0, endY = 0;

image.src = 'your-image-url.jpg';

onMounted(async() => {
  await load()
  if (canvas.value) {
    ctx.value = canvas.value.getContext('2d');
    canvas.value.width = 800;
    canvas.value.height = 600;
    image.onload = () => drawImage();
  }
});

function drawImage() {
  const c = canvas.value;
  ctx.value.clearRect(0, 0, c.width, c.height);
  const imgWidth = image.width * scale.value;
  const imgHeight = image.height * scale.value;
  const xOffset = (c.width - imgWidth) / 2 + offsetX.value;
  const yOffset = (c.height - imgHeight) / 2 + offsetY.value;
  ctx.value.drawImage(image, xOffset, yOffset, imgWidth, imgHeight);
  drawRegions(xOffset, yOffset);
}

function zoomImage(event) {
  scale.value += event.deltaY * -0.001;
  scale.value = Math.min(Math.max(0.5, scale.value), 3);
  drawImage();
}

function startSelection(event) {
  selecting = true;
  const rect = canvas.value.getBoundingClientRect();
  startX = (event.clientX - rect.left - offsetX.value) / scale.value;
  startY = (event.clientY - rect.top - offsetY.value) / scale.value;
}

function endSelection(event) {
  if (!selecting) return;
  selecting = false;
  const rect = canvas.value.getBoundingClientRect();
  endX = (event.clientX - rect.left - offsetX.value) / scale.value;
  endY = (event.clientY - rect.top - offsetY.value) / scale.value;
  regions.push({ x: startX, y: startY, width: endX - startX, height: endY - startY, label: '' });
  drawImage();
}

function updateSelection(event) {
  if (!selecting && !resizing && !dragging && !panning) return;
  drawImage();
  const rect = canvas.value.getBoundingClientRect();
  const mouseX = (event.clientX - rect.left - offsetX.value) / scale.value;
  const mouseY = (event.clientY - rect.top - offsetY.value) / scale.value;

  if (resizing && resizeIndex !== null) {
    const region = regions[resizeIndex];
    if (resizeDirection === 'bottom-right') {
      region.width = mouseX - region.x;
      region.height = mouseY - region.y;
    }
  } else if (dragging && activeRegionIndex !== null) {
    const region = regions[activeRegionIndex];
    region.x = mouseX;
    region.y = mouseY;
  } else if (panning) {
    offsetX.value += event.clientX - startPanX;
    offsetY.value += event.clientY - startPanY;
    startPanX = event.clientX;
    startPanY = event.clientY;
  }
}

function startResizing(index, event, direction = 'bottom-right') {
  resizing = true;
  resizeIndex = index;
  resizeDirection = direction;
  event.preventDefault();
  document.addEventListener('mouseup', stopInteraction);
  document.addEventListener('mousemove', updateSelection);
}

function startDragging(index, event) {
  dragging = true;
  activeRegionIndex = index;
  document.addEventListener('mouseup', stopInteraction);
  document.addEventListener('mousemove', updateSelection);
}

function startPanning(event) {
  event.preventDefault();
  panning = true;
  startPanX = event.clientX;
  startPanY = event.clientY;
  document.addEventListener('mouseup', stopInteraction);
  document.addEventListener('mousemove', updateSelection);
}

function stopInteraction() {
  resizing = false;
  dragging = false;
  panning = false;
  resizeIndex = null;
  activeRegionIndex = null;
  resizeDirection = '';
  document.removeEventListener('mouseup', stopInteraction);
  document.removeEventListener('mousemove', updateSelection);
}

function drawRegions(xOffset, yOffset) {
  // regions.forEach(region => {
  //   ctx.value.strokeStyle = 'blue';
  //   ctx.value.strokeRect(region.x * scale.value + xOffset, region.y * scale.value + yOffset, region.width * scale.value, region.height * scale.value);
  // });
}
function regionStyle(region) {
  return {
    left: `${(region.x * scale.value) + ((canvas.value.width - (image.width * scale.value)) / 2) + offsetX.value}px`,
    top: `${(region.y * scale.value) + ((canvas.value.height - (image.height * scale.value)) / 2) + offsetY.value}px`,
    width: `${region.width * scale.value}px`,
    height: `${region.height * scale.value}px`,
    position: 'absolute',
    cursor: 'move'
  };
}

async function load() { 
      
      state.ROIs = []
      state.file = null
      state.file_count = store.file_count || null
      if(store.skip >= 0) state.skip = store.skip + 1
      else state.skip = null

      var response = await web.getDocInfo(store.file['@rid'])
      state.file = response
      state.file.thumbnail = removeLastPathPart('/api/thumbnails/' + response.path)

      state.entities = await web.getEntities()

      image.src = state.file.thumbnail; 
      image.onload = () => {
        state.width = image.width;
        state.height = image.height;
        state.image_loaded = true
      };
    }

function saveRegions() {
  console.log(JSON.stringify(regions, null, 2));
}

function removeLastPathPart(str) {
        const lastIndex = str.lastIndexOf('/');
        if (lastIndex !== -1) {
          if(apiUrl)
            return apiUrl + str.substring(0, lastIndex);
          else
            return str.substring(0, lastIndex);
        }
        return str;
    }
</script>

<style>
.canvas-container {
  position: relative;
  display: inline-block;
}
canvas {
  border: 1px solid black;
}
.region-label {
  position: absolute;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid black;
  cursor: move;
}
.region-label input {
  width: 100%;
  border: none;
  background: transparent;
  text-align: center;
}
.resize-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: red;
  bottom: -5px;
  right: -5px;
  cursor: nwse-resize;
}
</style>
