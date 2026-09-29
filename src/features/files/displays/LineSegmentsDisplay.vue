<script setup>
import { onUnmounted, reactive, ref, watch } from 'vue'
import { getDocInfo, getNodeFile } from '@/api/files.js'
import { getFileAncestors } from '@/api/projects.js'
import LoadingState from '@/ui/LoadingState.vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import { previewUrl } from '../fileUrls.js'
import { imageAncestorPath, parseLineSegments } from '../lineSegments.js'
import { usePanZoom } from '../usePanZoom.js'

// Text line segmentation: the line polygons over the source image, and a
// list of lines. Hovering either highlights the line in both.
const props = defineProps({ file: { type: Object, required: true } })

const state = reactive({
  data: null,
  imagePath: null,
  loading: true,
  error: null,
  overlay: { width: 0, height: 0 },
})
const active = ref(null)
const image = ref(null)
const zoom = usePanZoom()
let resizer = null

async function resolveImagePath(data) {
  if (data.sourcePath) return data.sourcePath
  if (data.sourceRid) {
    const node = await getDocInfo(data.sourceRid).catch(() => null)
    if (node?.path) return node.path
  }
  return imageAncestorPath(await getFileAncestors(props.file['@rid']).catch(() => []))
}

function measure() {
  const rect = image.value?.getBoundingClientRect()
  if (rect)
    state.overlay = { width: rect.width / zoom.view.scale, height: rect.height / zoom.view.scale }
}

function onImageLoad() {
  measure()
  resizer?.disconnect()
  resizer = new ResizeObserver(measure)
  resizer.observe(image.value)
}

watch(
  () => props.file['@rid'],
  async (rid) => {
    Object.assign(state, { loading: true, error: null, data: null, imagePath: null })
    active.value = null
    zoom.reset()
    try {
      const data = parseLineSegments(await getNodeFile(rid))
      state.data = data
      state.imagePath = await resolveImagePath(data)
    } catch (error) {
      state.error = error
    } finally {
      state.loading = false
    }
  },
  { immediate: true },
)

onUnmounted(() => resizer?.disconnect())
</script>

<template>
  <div class="lines">
    <div class="lines__image">
      <LoadingState v-if="state.loading" />
      <ErrorAlert
        v-else-if="state.error"
        :error="state.error"
        title="Could not load the line segmentation"
      />
      <p v-else-if="!state.imagePath" class="lines__muted">No source image available.</p>
      <div v-else class="lines__stage" v-on="zoom.handlers" @wheel.prevent="zoom.onWheel">
        <div class="lines__canvas" :style="zoom.style.value">
          <img
            ref="image"
            :src="previewUrl(state.imagePath)"
            alt="Source image"
            class="lines__img"
            @load="onImageLoad"
          />
          <svg
            v-if="state.overlay.width"
            class="lines__overlay"
            :width="state.overlay.width"
            :height="state.overlay.height"
            :viewBox="`0 0 ${state.data.width || 1} ${state.data.height || 1}`"
            preserveAspectRatio="xMidYMid meet"
          >
            <polygon
              v-for="(line, index) in state.data.lines"
              :key="index"
              :points="line.points"
              :class="['lines__polygon', { 'lines__polygon--active': index === active }]"
              @mouseenter="active = index"
              @mouseleave="active = null"
            />
          </svg>
        </div>
      </div>
    </div>

    <aside class="lines__side">
      <h2 class="lines__title">{{ file.label || 'Line segments' }}</h2>
      <p class="lines__muted">{{ state.data?.lines.length || 0 }} lines detected</p>
      <v-list density="compact" class="lines__list">
        <v-list-item
          v-for="(line, index) in state.data?.lines || []"
          :key="index"
          :active="index === active"
          color="primary"
          @mouseenter="active = index"
          @mouseleave="active = null"
        >
          <template #prepend>
            <v-avatar size="28" :color="index === active ? 'primary' : 'surface-variant'">{{
              index + 1
            }}</v-avatar>
          </template>
          <v-list-item-title>Line {{ index + 1 }}</v-list-item-title>
          <v-list-item-subtitle>
            <template v-if="line.confidence !== null"
              >Confidence {{ line.confidence.toFixed(3) }}</template
            >
            <template v-if="line.size">
              · {{ Math.round(line.size.width) }}×{{ Math.round(line.size.height) }}</template
            >
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
      <div class="lines__zoom">
        <v-btn
          size="x-small"
          variant="outlined"
          icon="mdi-minus"
          aria-label="Zoom out"
          :disabled="zoom.view.scale <= zoom.min"
          @click="zoom.zoomOut"
        />
        <span>{{ Math.round(zoom.view.scale * 100) }}%</span>
        <v-btn
          size="x-small"
          variant="outlined"
          icon="mdi-plus"
          aria-label="Zoom in"
          :disabled="zoom.view.scale >= zoom.max"
          @click="zoom.zoomIn"
        />
        <v-btn
          size="x-small"
          variant="outlined"
          icon="mdi-fit-to-screen"
          aria-label="Fit"
          @click="zoom.reset"
        />
      </div>
      <p class="lines__muted">
        Scroll to zoom, drag to pan. Image {{ state.data?.width }} × {{ state.data?.height }} px.
      </p>
    </aside>
  </div>
</template>

<style scoped>
.lines {
  display: grid;
  grid-template-columns: 2fr 1fr;
  height: 100%;
}

.lines__image {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--md-space-4);
  overflow: hidden;
  border-inline-end: 1px solid var(--md-color-border);
  background: var(--md-color-bg);
}

.lines__stage {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  user-select: none;
}

.lines__canvas {
  position: relative;
  display: inline-block;
}

.lines__img {
  display: block;
  max-width: 100%;
  max-height: calc(100dvh - var(--md-header-height) * 2.5);
}

.lines__overlay {
  position: absolute;
  inset: 0;
}

.lines__polygon {
  fill: color-mix(in srgb, var(--md-color-primary) 12%, transparent);
  stroke: var(--md-color-primary);
  stroke-width: 4;
  vector-effect: non-scaling-stroke;
}

.lines__polygon--active {
  fill: color-mix(in srgb, var(--md-color-warning) 25%, transparent);
  stroke: var(--md-color-warning);
}

.lines__side {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: var(--md-space-4);
  background: var(--md-color-surface);
}

.lines__title {
  margin: 0;
  font-size: var(--md-font-size-lg);
}

.lines__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.lines__zoom {
  display: flex;
  align-items: center;
  gap: var(--md-space-2);
  margin-block: var(--md-space-3) var(--md-space-1);
}

.lines__muted {
  margin: 0;
  font-size: var(--md-font-size-xs);
  color: var(--md-color-text-muted);
}
</style>
