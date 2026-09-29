<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import LoadingState from '@/ui/LoadingState.vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import { folderPreviewUrl } from '../fileUrls.js'
import { toRid } from '../fileTypes.js'
import RoiToolsPanel from './RoiToolsPanel.vue'
import { useRois } from './useRois.js'
import {
  circlePx,
  dragShape,
  draftShape,
  isBigEnough,
  labelPosition,
  makeShapeId,
  pointPx,
  polygonPoints,
  rectHandles,
  rectPx,
} from './geometry.js'

// Draw, move, resize and label regions of interest (rectangles, circles,
// polygons) on an image, for one ROI set.
const props = defineProps({
  file: { type: Object, required: true },
  target: { type: [Object, String], required: true }, // the ROI set (node or rid)
})

const setRid = computed(() => toRid(props.target?.id || props.target?.['@rid'] || props.target))
const rois = useRois(
  () => props.file?.['@rid'],
  () => setRid.value,
)
const shapes = computed(() => rois.state.shapes)

const image = ref(null)
const size = reactive({ width: 0, height: 0 })
const tool = ref('rect')
const showLabels = ref(true)
const selectedId = ref(null)
const draft = ref(null)
const polygon = reactive({ points: [], hover: null })
const drag = reactive({
  type: null,
  id: null,
  handle: null,
  pointIndex: null,
  start: null,
  base: null,
  moved: false,
})

const selected = computed(() => shapes.value.find((s) => s.id === selectedId.value) || null)
const polygonDraftLine = computed(() =>
  polygonPoints(polygon.hover ? [...polygon.points, polygon.hover] : polygon.points, size),
)

function measure() {
  const rect = image.value?.getBoundingClientRect()
  if (rect) Object.assign(size, { width: rect.width, height: rect.height })
}

function pointFrom(event) {
  const rect = image.value.getBoundingClientRect()
  const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width))
  const y = Math.max(0, Math.min(event.clientY - rect.top, rect.height))
  return { x, y, xPct: (x / rect.width) * 100, yPct: (y / rect.height) * 100 }
}

const nextLabel = () => `Region ${shapes.value.length + 1}`

function addShape(shape) {
  rois.state.shapes = [...shapes.value, shape]
  selectedId.value = shape.id
  rois.save()
}

function deleteShape(id) {
  rois.state.shapes = shapes.value.filter((s) => s.id !== id)
  if (selectedId.value === id) selectedId.value = null
  rois.save()
}

function finishPolygon() {
  if (polygon.points.length < 3) return
  addShape({
    id: makeShapeId(),
    type: 'polygon',
    points: polygon.points.slice(),
    label: nextLabel(),
  })
  Object.assign(polygon, { points: [], hover: null })
}

function onDown(event) {
  if (!image.value || event.button !== 0) return
  const point = pointFrom(event)
  if (tool.value === 'polygon') {
    polygon.points.push({ xPct: point.xPct, yPct: point.yPct })
    return
  }
  const base =
    tool.value === 'rect'
      ? {
          id: makeShapeId(),
          type: 'rect',
          left: point.xPct,
          top: point.yPct,
          width: 0,
          height: 0,
          label: nextLabel(),
        }
      : {
          id: makeShapeId(),
          type: 'circle',
          cx: point.xPct,
          cy: point.yPct,
          r: 0,
          label: nextLabel(),
        }
  draft.value = base
  Object.assign(drag, { type: 'draw', start: point, base })
}

function onMove(event) {
  if (!image.value) return
  if (tool.value === 'polygon' && polygon.points.length) {
    const p = pointFrom(event)
    polygon.hover = { xPct: p.xPct, yPct: p.yPct }
  }
  if (!drag.type) return
  const point = pointFrom(event)
  if (drag.type === 'draw') {
    draft.value = draftShape(draft.value.type, drag.start, point, size, drag.base)
    return
  }
  const delta = { xPct: point.xPct - drag.start.xPct, yPct: point.yPct - drag.start.yPct }
  if (!drag.moved && Math.hypot(point.x - drag.start.x, point.y - drag.start.y) >= 2)
    drag.moved = true
  const at = shapes.value.findIndex((s) => s.id === drag.id)
  if (at >= 0)
    rois.state.shapes[at] = { ...dragShape(drag.base, drag, delta, point, size), id: drag.id }
}

function onUp() {
  if (drag.type === 'draw' && draft.value && isBigEnough(draft.value, size)) addShape(draft.value)
  else if (drag.type && drag.type !== 'draw' && drag.moved) rois.save()
  draft.value = null
  Object.assign(drag, {
    type: null,
    id: null,
    handle: null,
    pointIndex: null,
    start: null,
    base: null,
    moved: false,
  })
}

function startDrag(type, event, extra = {}) {
  const shape = extra.shape || selected.value
  selectedId.value = shape.id
  Object.assign(drag, {
    type,
    id: shape.id,
    start: pointFrom(event),
    base: structuredClone({ ...shape }),
    moved: false,
    ...extra,
  })
}

watch(
  tool,
  (next, prev) => prev === 'polygon' && Object.assign(polygon, { points: [], hover: null }),
)
watch(
  () => props.file['@rid'],
  () => {
    selectedId.value = null
    Object.assign(polygon, { points: [], hover: null })
  },
)

onMounted(() => {
  window.addEventListener('resize', measure)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
})
onUnmounted(() => {
  window.removeEventListener('resize', measure)
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
})
</script>

<template>
  <div class="roi">
    <div
      class="roi__canvas"
      @pointerdown="onDown"
      @dblclick.stop.prevent="tool === 'polygon' && finishPolygon()"
    >
      <LoadingState v-if="rois.state.loading" text="Loading regions…" />
      <div v-else class="roi__stage">
        <img
          ref="image"
          :src="folderPreviewUrl(file.path)"
          alt="Image to draw regions on"
          class="roi__img"
          draggable="false"
          @load="measure"
        />
        <svg v-if="size.width" class="roi__overlay" :width="size.width" :height="size.height">
          <g
            v-for="shape in shapes"
            :key="shape.id"
            :class="['roi__shape', { 'roi__shape--selected': shape.id === selectedId }]"
            @pointerdown.stop="startDrag('move', $event, { shape })"
          >
            <rect v-if="shape.type === 'rect'" v-bind="rectPx(shape, size)" rx="4" />
            <circle v-else-if="shape.type === 'circle'" v-bind="circlePx(shape, size)" />
            <polygon v-else :points="polygonPoints(shape.points, size)" />
            <text
              v-if="showLabels && shape.label"
              class="roi__label"
              text-anchor="middle"
              dominant-baseline="middle"
              v-bind="labelPosition(shape, size)"
            >
              {{ shape.label }}
            </text>
          </g>

          <g v-if="selected?.type === 'rect'">
            <circle
              v-for="handle in rectHandles(selected, size)"
              :key="handle.key"
              :cx="handle.x"
              :cy="handle.y"
              r="6"
              class="roi__handle"
              @pointerdown.stop="startDrag('resize-rect', $event, { handle: handle.key })"
            />
          </g>
          <circle
            v-else-if="selected?.type === 'circle'"
            :cx="circlePx(selected, size).cx + circlePx(selected, size).r"
            :cy="circlePx(selected, size).cy"
            r="6"
            class="roi__handle"
            @pointerdown.stop="startDrag('resize-circle', $event)"
          />
          <g v-else-if="selected?.type === 'polygon'">
            <circle
              v-for="(point, index) in selected.points"
              :key="index"
              :cx="pointPx(point, size).x"
              :cy="pointPx(point, size).y"
              r="6"
              class="roi__handle"
              @pointerdown.stop="startDrag('move-point', $event, { pointIndex: index })"
            />
          </g>

          <rect
            v-if="draft?.type === 'rect'"
            class="roi__draft"
            v-bind="rectPx(draft, size)"
            rx="4"
          />
          <circle
            v-else-if="draft?.type === 'circle'"
            class="roi__draft"
            v-bind="circlePx(draft, size)"
          />
          <polyline v-if="polygon.points.length" class="roi__draft" :points="polygonDraftLine" />
        </svg>
      </div>
    </div>

    <RoiToolsPanel
      v-model:tool="tool"
      v-model:show-labels="showLabels"
      v-model:auto-save="rois.autoSave.value"
      v-model:selected-id="selectedId"
      :shapes="shapes"
      :dirty="rois.state.dirty"
      :can-finish-polygon="tool === 'polygon' && polygon.points.length >= 3"
      @finish-polygon="finishPolygon"
      @save="rois.save(true)"
      @rename="(id, label) => (shapes.find((s) => s.id === id).label = label)"
      @label-changed="rois.save()"
      @delete="deleteShape"
    />

    <ErrorAlert :error="rois.state.error" title="Could not save the regions" class="roi__error" />
    <v-snackbar v-model="rois.savedNotice.value" color="success" timeout="2000"
      >Regions saved</v-snackbar
    >
  </div>
</template>

<style scoped>
.roi {
  position: relative;
  display: grid;
  grid-template-columns: 3fr 1fr;
  height: 100%;
}

.roi__canvas {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--md-space-4);
  overflow: auto;
  user-select: none;
  background: var(--md-color-bg);
}

.roi__stage {
  position: relative;
  display: inline-block;
}

.roi__img {
  display: block;
  max-width: 100%;
  height: auto;
}

.roi__overlay {
  position: absolute;
  inset: 0;
}

.roi__shape {
  fill: color-mix(in srgb, var(--md-color-primary) 20%, transparent);
  stroke: var(--md-color-primary);
  stroke-width: 2;
  cursor: move;
}

.roi__shape--selected {
  fill: color-mix(in srgb, var(--md-color-warning) 20%, transparent);
  stroke: var(--md-color-warning);
}

.roi__draft {
  fill: color-mix(in srgb, var(--md-color-success) 15%, transparent);
  stroke: var(--md-color-success);
  stroke-width: 2;
  stroke-dasharray: 4;
}

.roi__handle {
  fill: var(--md-color-surface);
  stroke: var(--md-color-warning);
  stroke-width: 2;
  cursor: pointer;
}

.roi__label {
  fill: var(--md-color-text-on-dark);
  stroke: var(--md-color-text);
  stroke-width: 3px;
  paint-order: stroke;
  font-size: var(--md-font-size-xs);
  font-weight: var(--md-font-weight-bold);
  pointer-events: none;
}

.roi__error {
  position: absolute;
  bottom: var(--md-space-4);
  left: var(--md-space-4);
  max-width: var(--md-dialog-width);
}
</style>
