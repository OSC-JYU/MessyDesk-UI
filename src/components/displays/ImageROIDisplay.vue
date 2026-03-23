<template>
  <v-container fluid class="roi-display pa-0">
    <v-snackbar v-model="saveNotice" color="success" timeout="2000">
      {{ saveNoticeText }}
    </v-snackbar>
    <v-btn
      class="ma-2"
      color="primary"
      icon="mdi-close"
      style="position: absolute; top: 0; left: -60px; z-index: 1000"
      @click="closeEditor"
    ></v-btn>

    <v-row no-gutters class="fill-height">
      <v-col cols="9" class="image-column">
        <v-sheet class="fill-height d-flex flex-column pa-4">
          <div
            class="image-wrapper"
            ref="imageWrapper"
            @pointerdown="onCanvasPointerDown"
            @pointermove="onCanvasPointerMove"
            @pointerup="onCanvasPointerUp"
            @pointerleave="onCanvasPointerUp"
            @dblclick.stop.prevent="onCanvasDoubleClick"
          >
            <div v-if="loading" class="placeholder d-flex align-center justify-center">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>
            <div v-else-if="!state.file" class="placeholder d-flex align-center justify-center text-medium-emphasis">
              No image available for this filter
            </div>
            <div v-else class="image-stage">
              <img
                :src="state.file.thumbnail"
                ref="imageElement"
                class="source-image"
                @load="onImageLoad"
                alt="ROI source"
              />
              <svg
                v-if="imageBounds.width && imageBounds.height"
                class="roi-overlay"
                :width="imageBounds.width"
                :height="imageBounds.height"
              >
                <!-- Template/individual shapes -->
                <g
                  v-for="shape in activeShapes"
                  :key="shape.id"
                  :class="['roi-shape', { selected: shape.id === selectedShapeId }]"
                  @pointerdown.stop="startShapeDrag(shape, $event)"
                >
                  <rect
                    v-if="shape.type === 'rect'"
                    :x="rectToPixels(shape).x"
                    :y="rectToPixels(shape).y"
                    :width="rectToPixels(shape).width"
                    :height="rectToPixels(shape).height"
                    :rx="4"
                  />
                  <circle
                    v-else-if="shape.type === 'circle'"
                    :cx="circleToPixels(shape).cx"
                    :cy="circleToPixels(shape).cy"
                    :r="circleToPixels(shape).r"
                  />
                  <polygon
                    v-else-if="shape.type === 'polygon'"
                    :points="polygonToPoints(shape)"
                  />
                  <text
                    v-if="showShapeLabels && shape.label"
                    class="roi-label"
                    text-anchor="middle"
                    dominant-baseline="middle"
                    :x="shapeLabelPosition(shape).x"
                    :y="shapeLabelPosition(shape).y"
                  >
                    {{ shape.label }}
                  </text>
                </g>
                <g v-if="selectedShape && selectedShape.type === 'rect'" class="roi-handles">
                  <circle
                    v-for="handle in rectHandles"
                    :key="`${selectedShape.id}-${handle.key}`"
                    :cx="handle.x"
                    :cy="handle.y"
                    r="6"
                    class="roi-handle"
                    @pointerdown.stop="startRectResize(handle.key, $event)"
                  />
                </g>
                <g v-if="selectedShape && selectedShape.type === 'circle'" class="roi-handles">
                  <circle
                    :cx="circleResizeHandle.x"
                    :cy="circleResizeHandle.y"
                    r="6"
                    class="roi-handle"
                    @pointerdown.stop="startCircleResize($event)"
                  />
                </g>
                <g v-if="selectedShape && selectedShape.type === 'polygon'" class="roi-handles">
                  <circle
                    v-for="(point, index) in polygonHandles"
                    :key="`${selectedShape.id}-pt-${index}`"
                    :cx="point.x"
                    :cy="point.y"
                    r="6"
                    class="roi-handle"
                    @pointerdown.stop="startPolygonPointDrag(index, $event)"
                  />
                </g>

                <!-- Draft shape -->
                <rect
                  v-if="draftShape && draftShape.type === 'rect'"
                  class="roi-draft"
                  :x="rectToPixels(draftShape).x"
                  :y="rectToPixels(draftShape).y"
                  :width="rectToPixels(draftShape).width"
                  :height="rectToPixels(draftShape).height"
                  :rx="4"
                />
                <circle
                  v-else-if="draftShape && draftShape.type === 'circle'"
                  class="roi-draft"
                  :cx="circleToPixels(draftShape).cx"
                  :cy="circleToPixels(draftShape).cy"
                  :r="circleToPixels(draftShape).r"
                />
                <polyline
                  v-if="polygonDraftPoints.length"
                  class="roi-draft"
                  :points="polygonDraftLine"
                />
              </svg>
            </div>
          </div>
        </v-sheet>
      </v-col>

      <v-col cols="3" class="tools-column">
        <v-sheet class="pa-4 fill-height d-flex flex-column">
          <div class="d-flex justify-start mb-3">
            <v-btn
              color="primary"
              variant="outlined"
              prepend-icon="mdi-exit-to-app"
              @click="closeEditor"
            >
              Exit
            </v-btn>
          </div>
          <div class="mb-4">
            <h3 class="text-h6 mb-1">Image ROI Editor</h3>
            <p class="text-caption text-medium-emphasis mb-0">
              {{ state.file?.label || 'Filter Regions' }}
            </p>
          </div>
          <div class="mb-4">
            <v-switch
              v-model="autoSave"
              label="Auto-save"
              inset
              density="compact"
            ></v-switch>
            <v-switch
              v-model="showShapeLabels"
              label="Show labels on shapes"
              inset
              density="compact"
            ></v-switch>
            <v-btn
              v-if="!autoSave"
              color="primary"
              variant="flat"
              :disabled="!hasUnsavedChanges"
              @click="persistActiveShapes(true)"
            >
              Save changes
            </v-btn>
            <v-alert
              v-if="!autoSave && hasUnsavedChanges"
              type="warning"
              variant="tonal"
              density="compact"
              class="mt-2"
            >
              You have unsaved changes.
            </v-alert>
          </div>

          <template v-if="state.file_count > 1">
            <div class="d-flex align-center mb-4">
              <v-btn @click="prev" :disabled="state.skip === 1" color="secondary" size="small">
                <v-icon>mdi-chevron-left</v-icon>
              </v-btn>
              <span class="mx-3 text-caption">{{ state.skip }} / {{ state.file_count }}</span>
              <v-btn @click="next" :disabled="state.skip === state.file_count" color="secondary" size="small">
                <v-icon>mdi-chevron-right</v-icon>
              </v-btn>
            </div>
          </template>

          <div class="mb-4">
            <div class="text-caption text-medium-emphasis mb-2">Mode</div>
            <v-btn-toggle v-model="state.mode" density="comfortable" divided>
              <v-btn value="individual">Individual</v-btn>
              <v-btn value="template">Template</v-btn>
            </v-btn-toggle>
            <div v-if="state.mode === 'template'" class="mt-2">
              <v-btn
                size="small"
                variant="outlined"
                @click="toggleTemplateOverride"
              >
                {{ templateOverrideActive ? 'Use template for this image' : 'Override for this image' }}
              </v-btn>
            </div>
          </div>

          <div class="mb-4">
            <div class="text-caption text-medium-emphasis mb-2">Tool</div>
            <v-btn-toggle v-model="activeTool" density="comfortable" divided>
              <v-btn value="rect">
                <v-icon start icon="mdi-shape-rectangle-plus"></v-icon>
                Rect
              </v-btn>
              <v-btn value="circle">
                <v-icon start icon="mdi-circle-outline"></v-icon>
                Circle
              </v-btn>
              <v-btn value="polygon">
                <v-icon start icon="mdi-shape-polygon-plus"></v-icon>
                Polygon
              </v-btn>
            </v-btn-toggle>
            <div v-if="activeTool === 'polygon'" class="text-caption text-medium-emphasis mt-2">
              Click to add points · Double click or press Finish to close
            </div>
            <v-btn
              v-if="activeTool === 'polygon' && polygonDraftPoints.length >= 3"
              class="mt-2"
              size="small"
              variant="outlined"
              @click="finishPolygon"
            >
              Finish polygon
            </v-btn>
          </div>

          <v-divider class="my-4"></v-divider>

          <div class="flex-grow-1 overflow-y-auto">
            <div class="text-caption text-medium-emphasis mb-2">Regions</div>
            <v-list density="compact">
              <v-list-item
                v-for="shape in activeShapes"
                :key="shape.id"
                :value="shape.id"
                :class="{ 'selected-item': shape.id === selectedShapeId }"
                @click="selectedShapeId = shape.id"
              >
                <template #prepend>
                  <v-icon :icon="shapeIcon(shape.type)" size="18"></v-icon>
                </template>
                <v-list-item-title>
                  <v-text-field
                    v-model="shape.label"
                    density="compact"
                    variant="outlined"
                    hide-details
                    placeholder="Label"
                    class="shape-label"
                    @blur="persistActiveShapes"
                  ></v-text-field>
                </v-list-item-title>
                <template #append>
                  <v-btn
                    icon="mdi-delete"
                    size="x-small"
                    variant="text"
                    @click.stop="deleteShape(shape.id)"
                  ></v-btn>
                </template>
              </v-list-item>
            </v-list>
            <div v-if="activeShapes.length === 0" class="text-caption text-medium-emphasis">
              No regions yet. Pick a tool and draw on the image.
            </div>
          </div>


        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import web from '../../web.js'
import { store } from '../Store.js'
import { fi } from 'vuetify/locale'

const apiUrl = import.meta.env.VITE_API_PATH

const DEV_SET_RID = '#142:92'

const emit = defineEmits(['change-tab'])
const props = defineProps(['tab'])

const loading = ref(false)
const imageWrapper = ref(null)
const imageElement = ref(null)
const saveNotice = ref(false)
const saveNoticeText = ref('ROI changes saved')
const autoSave = ref(true)
const hasUnsavedChanges = ref(false)

const state = reactive({
  file: null,
  file_count: 0,
  skip: 1,
  parent: null,
  parent_type: null,
  mode: 'individual',
  template_overrides: {},
  template_shapes: [],
  shapes_by_file: {},
  roi_files_by_file: {}
})

const imageBounds = reactive({ width: 0, height: 0 })
const activeTool = ref('rect')
const draftShape = ref(null)
const polygonDraftPoints = ref([])
const polygonHoverPoint = ref(null)
const selectedShapeId = ref(null)
const showShapeLabels = ref(true)

const dragState = reactive({
  type: null,
  shapeId: null,
  handle: null,
  pointIndex: null,
  startPoint: null,
  startShape: null,
  didMove: false
})

const MIN_SIZE_PX = 12

const templateOverrideActive = computed(() => {
  if (!state.file) return false
  return Boolean(state.template_overrides[state.file['@rid']])
})

const activeShapes = computed(() => getActiveShapes())

const selectedShape = computed(() => {
  return activeShapes.value.find(shape => shape.id === selectedShapeId.value) || null
})

const rectHandles = computed(() => {
  if (!selectedShape.value || selectedShape.value.type !== 'rect') return []
  const rect = rectToPixels(selectedShape.value)
  return [
    { key: 'top-left', x: rect.x, y: rect.y },
    { key: 'top-right', x: rect.x + rect.width, y: rect.y },
    { key: 'bottom-left', x: rect.x, y: rect.y + rect.height },
    { key: 'bottom-right', x: rect.x + rect.width, y: rect.y + rect.height }
  ]
})

const circleResizeHandle = computed(() => {
  if (!selectedShape.value || selectedShape.value.type !== 'circle') return { x: 0, y: 0 }
  const circle = circleToPixels(selectedShape.value)
  return { x: circle.cx + circle.r, y: circle.cy }
})

const polygonHandles = computed(() => {
  if (!selectedShape.value || selectedShape.value.type !== 'polygon') return []
  return selectedShape.value.points.map(point => {
    const coords = pointToPixels(point)
    return { x: coords.x, y: coords.y }
  })
})

const polygonDraftLine = computed(() => {
  const points = polygonDraftPoints.value.map(point => {
    const coords = pointToPixels(point)
    return `${coords.x},${coords.y}`
  })
  if (polygonHoverPoint.value) {
    const hover = pointToPixels(polygonHoverPoint.value)
    points.push(`${hover.x},${hover.y}`)
  }
  return points.join(' ')
})

function closeEditor() {
  store.filter_editor = null
  emit('change-tab', store.tab)
}

function shapeIcon(type) {
  if (type === 'circle') return 'mdi-circle-outline'
  if (type === 'polygon') return 'mdi-shape-polygon-plus'
  return 'mdi-shape-rectangle-plus'
}

function getActiveShapes() {
  if (!state.file) return []
  if (state.mode === 'template' && !templateOverrideActive.value) {
    return state.template_shapes
  }
  const fileId = state.file['@rid']
  if (!state.shapes_by_file[fileId]) {
    state.shapes_by_file[fileId] = []
  }
  return state.shapes_by_file[fileId]
}

function setActiveShapes(shapes) {
  if (!state.file) return
  if (state.mode === 'template' && !templateOverrideActive.value) {
    state.template_shapes = shapes
    return
  }
  const fileId = state.file['@rid']
  state.shapes_by_file[fileId] = shapes
}

function toggleTemplateOverride() {
  if (!state.file) return
  const fileId = state.file['@rid']
  if (state.template_overrides[fileId]) {
    delete state.template_overrides[fileId]
    return
  }
  state.template_overrides[fileId] = true
  if (!state.shapes_by_file[fileId] || state.shapes_by_file[fileId].length === 0) {
    state.shapes_by_file[fileId] = cloneShapes(state.template_shapes)
  }
}

function cloneShapes(shapes) {
  return shapes.map(shape => JSON.parse(JSON.stringify(shape)))
}

function makeShapeId() {
  return `roi_${Date.now()}_${Math.floor(Math.random() * 10000)}`
}

function normalizeROIs(rois) {
  if (!rois) return []
  if (Array.isArray(rois)) {
    return rois.map(r => ({ ...r, id: r.id || r['@rid'] || makeShapeId() }))
  }
  const roisMap = rois.rois && typeof rois.rois === 'object' ? rois.rois : rois
  if (roisMap && typeof roisMap === 'object') {
    return Object.entries(roisMap).map(([id, data]) => ({
      ...data,
      id: id || data.id || data['@rid'] || makeShapeId(),
      '@rid': data['@rid'] || id
    }))
  }
  return []
}

function getRoiFileRid(rois) {
  if (!rois || typeof rois !== 'object') return null
  return rois['@rid'] || rois.rid || rois.roi_rid || null
}

function getCurrentSetRid() {
  const editorRid = store.filter_editor?.id || store.filter_editor?.['@rid'] || store.filter_editor
  if (editorRid) return editorRid
  if (state.parent && (state.parent_type === 'Set' || state.parent_type === 'set')) {
    return state.parent['@rid'] || state.parent.id || null
  }
  return state.file?.set || null
}

function onImageLoad() {
  updateImageBounds()
}

function updateImageBounds() {
  if (!imageElement.value) return
  const rect = imageElement.value.getBoundingClientRect()
  imageBounds.width = rect.width
  imageBounds.height = rect.height
}

function getPointFromEvent(event) {
  const rect = imageElement.value.getBoundingClientRect()
  const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width))
  const y = Math.max(0, Math.min(event.clientY - rect.top, rect.height))
  return {
    x,
    y,
    xPct: (x / rect.width) * 100,
    yPct: (y / rect.height) * 100,
    width: rect.width,
    height: rect.height
  }
}

function onCanvasPointerDown(event) {
  if (!imageElement.value || event.button !== 0) return
  if (activeTool.value === 'polygon') {
    addPolygonPoint(event)
    return
  }
  const point = getPointFromEvent(event)
  if (activeTool.value === 'rect') {
    draftShape.value = {
      id: makeShapeId(),
      type: 'rect',
      left: point.xPct,
      top: point.yPct,
      width: 0,
      height: 0,
      label: `Region ${activeShapes.value.length + 1}`
    }
    dragState.type = 'draw-rect'
    dragState.startPoint = point
  } else if (activeTool.value === 'circle') {
    draftShape.value = {
      id: makeShapeId(),
      type: 'circle',
      cx: point.xPct,
      cy: point.yPct,
      r: 0,
      label: `Region ${activeShapes.value.length + 1}`
    }
    dragState.type = 'draw-circle'
    dragState.startPoint = point
  }
}

function onCanvasPointerMove(event) {
  if (!imageElement.value) return
  if (activeTool.value === 'polygon' && polygonDraftPoints.value.length) {
    const point = getPointFromEvent(event)
    polygonHoverPoint.value = { xPct: point.xPct, yPct: point.yPct }
  }
  if (!dragState.type || !dragState.startPoint || !draftShape.value) return
  const point = getPointFromEvent(event)
  if (dragState.type === 'draw-rect') {
    const left = Math.min(dragState.startPoint.xPct, point.xPct)
    const top = Math.min(dragState.startPoint.yPct, point.yPct)
    const width = Math.abs(point.xPct - dragState.startPoint.xPct)
    const height = Math.abs(point.yPct - dragState.startPoint.yPct)
    draftShape.value.left = left
    draftShape.value.top = top
    draftShape.value.width = width
    draftShape.value.height = height
  } else if (dragState.type === 'draw-circle') {
    const dx = point.x - dragState.startPoint.x
    const dy = point.y - dragState.startPoint.y
    const radiusPx = Math.sqrt(dx * dx + dy * dy)
    const minSide = Math.min(point.width, point.height)
    const maxRadiusPx = getMaxCircleRadiusPx(dragState.startPoint)
    const clampedRadius = Math.min(radiusPx, maxRadiusPx)
    draftShape.value.r = (clampedRadius / minSide) * 100
  }
}

function onCanvasPointerUp(event) {
  if (dragState.type === 'draw-rect' && draftShape.value) {
    const rect = rectToPixels(draftShape.value)
    if (rect.width >= MIN_SIZE_PX && rect.height >= MIN_SIZE_PX) {
      addShape(draftShape.value)
    }
    draftShape.value = null
  }
  if (dragState.type === 'draw-circle' && draftShape.value) {
    const circle = circleToPixels(draftShape.value)
    if (circle.r * 2 >= MIN_SIZE_PX) {
      addShape(draftShape.value)
    }
    draftShape.value = null
  }
  if (dragState.type && dragState.type !== 'draw-rect' && dragState.type !== 'draw-circle' && dragState.didMove) {
    persistActiveShapes()
  }
  dragState.type = null
  dragState.startPoint = null
}

function addPolygonPoint(event) {
  const point = getPointFromEvent(event)
  polygonDraftPoints.value.push({ xPct: point.xPct, yPct: point.yPct })
}

function onCanvasDoubleClick() {
  if (activeTool.value !== 'polygon') return
  if (polygonDraftPoints.value.length < 3) return
  finishPolygon()
}

function finishPolygon() {
  if (polygonDraftPoints.value.length < 3) return
  addShape({
    id: makeShapeId(),
    type: 'polygon',
    points: polygonDraftPoints.value.slice(),
    label: `Region ${activeShapes.value.length + 1}`
  })
  polygonDraftPoints.value = []
  polygonHoverPoint.value = null
}

async function addShape(shape) {
  const shapes = getActiveShapes()
  shapes.push(shape)
  setActiveShapes(shapes)
  selectedShapeId.value = shape.id
  await persistActiveShapes()
}

async function deleteShape(shapeId) {
  const shapes = getActiveShapes().filter(shape => shape.id !== shapeId)
  setActiveShapes(shapes)
  if (selectedShapeId.value === shapeId) selectedShapeId.value = null
  await persistActiveShapes()
}

async function persistActiveShapes(force = false) {
  if (!autoSave.value && !force) {
    hasUnsavedChanges.value = true
    return
  }
  if (!state.file || !state.file['@rid']) return
  const setRid = getCurrentSetRid()
  if (!setRid) return
  const fileRid = state.file['@rid']
  const shapes = getActiveShapes()
  const roisMap = shapes.reduce((acc, shape) => {
    const shapeId = shape['@rid'] || shape.id || makeShapeId()
    shape['@rid'] = shapeId
    shape.id = shapeId
    acc[shapeId] = { ...shape, id: shapeId }
    return acc
  }, {})
  const roiFileRid = state.roi_files_by_file[fileRid]
  try {
    if (roiFileRid) {
      await web.updateImageROI(fileRid, setRid, roiFileRid, roisMap)
    } else {
      const result = await web.saveImageROIs(fileRid, setRid, roisMap)
      const savedRid = result?.data?.['@rid'] || result?.['@rid'] || null
      if (savedRid) {
        state.roi_files_by_file[fileRid] = savedRid
      }
    }
    hasUnsavedChanges.value = false
    saveNoticeText.value = 'ROI changes saved'
    saveNotice.value = true
  } catch (error) {
    console.error('Failed to save ROIs:', error)
  }
}

function startShapeDrag(shape, event) {
  selectedShapeId.value = shape.id
  dragState.type = 'move-shape'
  dragState.shapeId = shape.id
  dragState.startPoint = getPointFromEvent(event)
  dragState.startShape = JSON.parse(JSON.stringify(shape))
  dragState.didMove = false
}

function startRectResize(handleKey, event) {
  dragState.type = 'resize-rect'
  dragState.shapeId = selectedShapeId.value
  dragState.handle = handleKey
  dragState.startPoint = getPointFromEvent(event)
  dragState.startShape = JSON.parse(JSON.stringify(selectedShape.value))
  dragState.didMove = false
}

function startCircleResize(event) {
  dragState.type = 'resize-circle'
  dragState.shapeId = selectedShapeId.value
  dragState.startPoint = getPointFromEvent(event)
  dragState.startShape = JSON.parse(JSON.stringify(selectedShape.value))
  dragState.didMove = false
}

function startPolygonPointDrag(index, event) {
  dragState.type = 'move-point'
  dragState.shapeId = selectedShapeId.value
  dragState.pointIndex = index
  dragState.startPoint = getPointFromEvent(event)
  dragState.startShape = JSON.parse(JSON.stringify(selectedShape.value))
  dragState.didMove = false
}

function onWindowPointerMove(event) {
  if (!imageElement.value || !dragState.type || !dragState.shapeId) return
  const shapes = getActiveShapes()
  const shapeIndex = shapes.findIndex(shape => shape.id === dragState.shapeId)
  if (shapeIndex === -1) return

  const currentPoint = getPointFromEvent(event)
  const dxPct = currentPoint.xPct - dragState.startPoint.xPct
  const dyPct = currentPoint.yPct - dragState.startPoint.yPct
  const dxPx = currentPoint.x - dragState.startPoint.x
  const dyPx = currentPoint.y - dragState.startPoint.y
  if (!dragState.didMove && Math.hypot(dxPx, dyPx) >= 2) {
    dragState.didMove = true
  }
  const shape = shapes[shapeIndex]
  const base = dragState.startShape

  if (dragState.type === 'move-shape') {
    if (shape.type === 'rect') {
      shape.left = clamp(base.left + dxPct, 0, 100 - base.width)
      shape.top = clamp(base.top + dyPct, 0, 100 - base.height)
    } else if (shape.type === 'circle') {
      const minSide = Math.min(imageBounds.width, imageBounds.height)
      const radiusPx = (base.r / 100) * minSide
      const nextCxPx = clamp(((base.cx + dxPct) / 100) * imageBounds.width, radiusPx, imageBounds.width - radiusPx)
      const nextCyPx = clamp(((base.cy + dyPct) / 100) * imageBounds.height, radiusPx, imageBounds.height - radiusPx)
      shape.cx = (nextCxPx / imageBounds.width) * 100
      shape.cy = (nextCyPx / imageBounds.height) * 100
    } else if (shape.type === 'polygon') {
      shape.points = base.points.map(point => ({
        xPct: clamp(point.xPct + dxPct, 0, 100),
        yPct: clamp(point.yPct + dyPct, 0, 100)
      }))
    }
  }

  if (dragState.type === 'resize-rect') {
    const minWidth = (MIN_SIZE_PX / imageBounds.width) * 100
    const minHeight = (MIN_SIZE_PX / imageBounds.height) * 100
    let left = base.left
    let top = base.top
    let width = base.width
    let height = base.height

    if (dragState.handle.includes('right')) {
      width = clamp(base.width + dxPct, minWidth, 100 - base.left)
    }
    if (dragState.handle.includes('left')) {
      left = clamp(base.left + dxPct, 0, base.left + base.width - minWidth)
      width = clamp(base.width - dxPct, minWidth, base.left + base.width)
    }
    if (dragState.handle.includes('bottom')) {
      height = clamp(base.height + dyPct, minHeight, 100 - base.top)
    }
    if (dragState.handle.includes('top')) {
      top = clamp(base.top + dyPct, 0, base.top + base.height - minHeight)
      height = clamp(base.height - dyPct, minHeight, base.top + base.height)
    }

    shape.left = left
    shape.top = top
    shape.width = width
    shape.height = height
  }

  if (dragState.type === 'resize-circle') {
    const centerPx = percentToPixels({ xPct: base.cx, yPct: base.cy })
    const dx = currentPoint.x - centerPx.x
    const dy = currentPoint.y - centerPx.y
    const radiusPx = Math.max(MIN_SIZE_PX / 2, Math.sqrt(dx * dx + dy * dy))
    const maxRadiusPx = getMaxCircleRadiusPx(centerPx)
    const clampedRadius = Math.min(radiusPx, maxRadiusPx)
    const minSide = Math.min(imageBounds.width, imageBounds.height)
    shape.r = clamp((clampedRadius / minSide) * 100, 0, 100)
  }

  if (dragState.type === 'move-point') {
    shape.points = base.points.map((point, idx) => {
      if (idx !== dragState.pointIndex) return point
      return {
        xPct: clamp(point.xPct + dxPct, 0, 100),
        yPct: clamp(point.yPct + dyPct, 0, 100)
      }
    })
  }

  setActiveShapes(shapes)
}

async function onWindowPointerUp() {
  if (dragState.type && dragState.didMove) {
    await persistActiveShapes()
  }
  dragState.type = null
  dragState.shapeId = null
  dragState.handle = null
  dragState.pointIndex = null
  dragState.startPoint = null
  dragState.startShape = null
  dragState.didMove = false
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function getMaxCircleRadiusPx(centerPoint) {
  if (!imageElement.value) return 0
  const rect = imageElement.value.getBoundingClientRect()
  const center = centerPoint || { x: rect.width / 2, y: rect.height / 2 }
  return Math.min(
    center.x,
    rect.width - center.x,
    center.y,
    rect.height - center.y
  )
}

function rectToPixels(shape) {
  return {
    x: (shape.left / 100) * imageBounds.width,
    y: (shape.top / 100) * imageBounds.height,
    width: (shape.width / 100) * imageBounds.width,
    height: (shape.height / 100) * imageBounds.height
  }
}

function circleToPixels(shape) {
  const minSide = Math.min(imageBounds.width, imageBounds.height)
  return {
    cx: (shape.cx / 100) * imageBounds.width,
    cy: (shape.cy / 100) * imageBounds.height,
    r: (shape.r / 100) * minSide
  }
}

function pointToPixels(point) {
  return {
    x: (point.xPct / 100) * imageBounds.width,
    y: (point.yPct / 100) * imageBounds.height
  }
}

function percentToPixels(point) {
  return pointToPixels(point)
}

function polygonToPoints(shape) {
  return shape.points.map(point => {
    const coords = pointToPixels(point)
    return `${coords.x},${coords.y}`
  }).join(' ')
}

function shapeLabelPosition(shape) {
  if (!shape) return { x: 0, y: 0 }
  if (shape.type === 'rect') {
    const rect = rectToPixels(shape)
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
  }
  if (shape.type === 'circle') {
    const circle = circleToPixels(shape)
    return { x: circle.cx, y: circle.cy }
  }
  if (shape.type === 'polygon' && Array.isArray(shape.points) && shape.points.length) {
    const pts = shape.points.map(point => pointToPixels(point))
    if (pts.length < 3) return { x: pts[0].x, y: pts[0].y }
    let area = 0
    let cx = 0
    let cy = 0
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i]
      const p2 = pts[(i + 1) % pts.length]
      const cross = (p1.x * p2.y) - (p2.x * p1.y)
      area += cross
      cx += (p1.x + p2.x) * cross
      cy += (p1.y + p2.y) * cross
    }
    area *= 0.5
    if (area === 0) {
      return { x: pts[0].x, y: pts[0].y }
    }
    cx /= (6 * area)
    cy /= (6 * area)
    return { x: cx, y: cy }
  }
  return { x: 0, y: 0 }
}

async function loadContext() {
  console.log('Loading filter context, filter_editor:', store.filter_editor)
  if (!store.filter_editor) return
  loading.value = true
  state.file = null
  state.parent = null
  state.parent_type = null
  state.file_count = 0
  state.skip = 1
  polygonDraftPoints.value = []
  polygonHoverPoint.value = null
  selectedShapeId.value = null

  try {
    // if (store.source) {
    //   const response = await web.getDocInfo(store.source)
    //   state.file = response
    //   state.file.thumbnail = buildThumbnailPath(response.path)
    //   state.file_count = 1
    //   state.skip = 1
    //   return
    // }
    // if (DEV_SET_RID) {
    //   state.parent = { '@rid': DEV_SET_RID, '@type': 'Set' }
    //   state.parent_type = 'Set'
    //   await loadSetFile(DEV_SET_RID, 0)
    //   return
    // }
    const filterRid = store.filter_editor?.id || store.filter_editor?.['@rid'] || store.filter_editor
    if (!filterRid) return
    console.log('Loading context for filter RID:', filterRid)
    const path = await web.getNodePath(filterRid)
    console.log('Node path for filter:', path)
    const parent = findParentNode(path, filterRid)
    if (!parent) {
      loading.value = false
      return
    }
    console.log('Found parent node:', parent)
    console.log(store.source)
    state.parent = parent
    state.parent_type = parent['@type'] || parent.type
    if (state.parent_type === 'Set' || state.parent_type === 'set') {
      await loadSetFile(parent['@rid'], 0)
    } else {
      await loadSingleFile(parent['@rid'])
    }
  } catch (error) {
    console.error('Failed to load filter context', error)
  } finally {
    loading.value = false
  }
}

function findParentNode(nodes, filterRid) {
  console.log('Finding parent node in path:', nodes)
  console.log('Filter RID to exclude:', filterRid)
  if (!Array.isArray(nodes)) return null
  const candidates = nodes.filter(node => isFileOrSetNode(node, filterRid))
  const setNode = candidates.find(node => node?.['@type'] === 'Set')
  if (setNode) return setNode
  const imageFile = candidates.find(node => node?.['@type'] === 'File' && node?.type === 'image')
  if (imageFile) return imageFile
  if (candidates.length) return candidates[0]
  return null
}

function isFileOrSetNode(node, filterRid) {
  if (!node) return false
  if (node['@rid'] === filterRid) return false
  return node?.['@type'] === 'File' || node?.['@type'] === 'Set'
}

async function loadSingleFile(rid) {
  const response = await web.getDocInfo(rid)
  state.file = response
  state.file_count = 1
  state.skip = 1
  state.file.thumbnail = buildThumbnailPath(response.path)
  // Load ROIs for this file
  if (state.file && state.file['@rid']) {
    const setRid = getCurrentSetRid()
    if (!setRid) return
    const shapes = await web.getImageROIs(state.file['@rid'], setRid)
    console.log('Loaded ROIs for file', state.file['@rid'], shapes)
    const normalized = normalizeROIs(shapes)
    if (normalized.length) {
      state.shapes_by_file[state.file['@rid']] = normalized
    }
    const roiFileRid = getRoiFileRid(shapes)
    if (roiFileRid) {
      state.roi_files_by_file[state.file['@rid']] = roiFileRid
    }
  }
}

async function loadSetFile(setRid, skip) {
  console.log('Loading set file for set RID:', setRid, 'skip:', skip)
  const response = await web.getSetFiles(setRid, skip, 1)
  const file = response.files[0]
  if (!file) return
  state.file_count = response.file_count || 1
  state.skip = skip + 1
  const fileInfo = await web.getDocInfo(file['@rid'])
  fileInfo.thumbnail = buildThumbnailPath(fileInfo.path)
  state.file = fileInfo
  // Load ROIs for this file
  if (state.file && state.file['@rid']) {
    const currentSetRid = getCurrentSetRid() || setRid
    if (!currentSetRid) return
    const rois = await web.getImageROIs(state.file['@rid'], currentSetRid)
    console.log('Loaded ROIs for file', state.file['@rid'], rois)
    const normalized = normalizeROIs(rois)
    if (normalized.length) {
      state.shapes_by_file[state.file['@rid']] = normalized
    }
    const roiFileRid = getRoiFileRid(rois)
    if (roiFileRid) {
      state.roi_files_by_file[state.file['@rid']] = roiFileRid
    }
  }
}

async function next() {
  if (state.skip >= state.file_count) return
  await loadSetFile(state.parent['@rid'], state.skip)
}

async function prev() {
  if (state.skip <= 1) return
  await loadSetFile(state.parent['@rid'], state.skip - 2)
}

function buildThumbnailPath(filePath) {
  if (!filePath) return ''
  const lastIndex = filePath.lastIndexOf('/')
  if (lastIndex === -1) return ''
  const base = `/api/thumbnails/${filePath.substring(0, lastIndex)}`
  return apiUrl ? `${apiUrl}${base}` : base
}

watch(() => store.filter_editor, () => {
  loadContext()
})

watch(() => state.mode, () => {
  selectedShapeId.value = null
})

watch(() => autoSave.value, (newValue) => {
  if (newValue && hasUnsavedChanges.value) {
    persistActiveShapes(true)
  }
})

watch(() => activeTool.value, (newValue, oldValue) => {
  if (oldValue === 'polygon' && newValue !== 'polygon') {
    polygonDraftPoints.value = []
    polygonHoverPoint.value = null
  }
})

onMounted(async () => {
  await loadContext()
  window.addEventListener('resize', updateImageBounds)
  window.addEventListener('pointermove', onWindowPointerMove)
  window.addEventListener('pointerup', onWindowPointerUp)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateImageBounds)
  window.removeEventListener('pointermove', onWindowPointerMove)
  window.removeEventListener('pointerup', onWindowPointerUp)
})
</script>

<style scoped>
.roi-display {
  background: #fff;
}

.image-column {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  height: calc(100vh - 64px);
}

.tools-column {
  height: calc(100vh - 64px);
}

.image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
}

.image-stage {
  position: relative;
  display: inline-block;
}

.source-image {
  display: block;
  max-width: 100%;
  height: auto;
  user-select: none;
  -webkit-user-drag: none;
}

.roi-overlay {
  position: absolute;
  top: 0;
  left: 0;
}

.roi-shape {
  fill: rgba(33, 150, 243, 0.2);
  stroke: #2196f3;
  stroke-width: 2;
  cursor: move;
}

.roi-shape.selected {
  stroke: #ff9800;
  fill: rgba(255, 152, 0, 0.2);
}

.roi-draft {
  fill: rgba(76, 175, 80, 0.15);
  stroke: #4caf50;
  stroke-width: 2;
  stroke-dasharray: 4;
}

.roi-handle {
  fill: #fff;
  stroke: #ff9800;
  stroke-width: 2;
  cursor: pointer;
}

.roi-label {
  fill: #ffffff;
  stroke: rgba(0, 0, 0, 0.75);
  stroke-width: 3px;
  paint-order: stroke;
  font-size: 12px;
  font-weight: 600;
  pointer-events: none;
}

.placeholder {
  min-height: 320px;
}

.shape-label :deep(.v-field__input) {
  padding: 4px 6px;
  font-size: 12px;
}

.selected-item {
  background-color: rgba(255, 152, 0, 0.1);
}
</style>
