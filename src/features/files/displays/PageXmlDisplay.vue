<script setup>
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { getFileAncestors } from '@/api/projects.js'
import ThumbnailImage from '@/ui/ThumbnailImage.vue'
import DisplayFrame from './DisplayFrame.vue'
import { useFileContent, asText } from '../useFileContent.js'
import { previewUrl } from '../fileUrls.js'
import { imageAncestorPath } from '../lineSegments.js'
import { parsePageXml } from '../pageXml.js'
import { usePanZoom } from '../usePanZoom.js'

// PAGE XML (page.xml): the recognised text, or the text drawn on the source
// image at the position of each line. Hovering a line on the image hides its
// text, so the original writing shows through.
const props = defineProps({ file: { type: Object, required: true } })

const { state } = useFileContent(() => props.file)
const page = computed(() => parsePageXml(asText(state.content)))
const mode = ref('text')
const active = ref(null)
const image = reactive({ path: null, failed: false, overlay: { width: 0, height: 0 } })
const imageEl = ref(null)
const zoom = usePanZoom()
let resizer = null

const placedLines = computed(() => page.value.lines.filter((line) => line.box?.height > 0))

watch(
  () => props.file['@rid'],
  async (rid) => {
    Object.assign(image, { path: null, failed: false, overlay: { width: 0, height: 0 } })
    active.value = null
    zoom.reset()
    image.path = imageAncestorPath(await getFileAncestors(rid).catch(() => []))
  },
  { immediate: true },
)

function measure() {
  const rect = imageEl.value?.getBoundingClientRect()
  if (rect)
    image.overlay = { width: rect.width / zoom.view.scale, height: rect.height / zoom.view.scale }
}

function onImageLoad() {
  measure()
  resizer?.disconnect()
  resizer = new ResizeObserver(measure)
  resizer.observe(imageEl.value)
}

// The text fills the line's box: its height sets the size, its width the spacing.
function textAttrs(line) {
  const { x, y, width, height } = line.box
  return {
    x,
    y: y + height * 0.78,
    'font-size': height * 0.8,
    textLength: width > 0 ? width : undefined,
    lengthAdjust: 'spacingAndGlyphs',
  }
}

onUnmounted(() => resizer?.disconnect())
</script>

<template>
  <div class="page-xml">
    <div class="page-xml__bar">
      <v-btn-toggle v-model="mode" mandatory density="compact" variant="outlined" divided>
        <v-btn value="text" prepend-icon="mdi-text">Text</v-btn>
        <v-btn value="image" prepend-icon="mdi-image-text" :disabled="!image.path">On image</v-btn>
      </v-btn-toggle>
      <span class="page-xml__muted">{{ page.lines.length }} text lines</span>
      <div v-if="mode === 'image'" class="page-xml__zoom">
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
    </div>

    <DisplayFrame
      v-if="mode === 'text'"
      :loading="state.loading"
      :error="state.error"
      class="page-xml__body"
    >
      <p v-if="!page.lines.length" class="page-xml__muted">No text lines were found on the page.</p>
      <div v-for="region in page.regions" :key="region.id" class="page-xml__region">
        <div v-for="(line, index) in region.lines" :key="line.id || index" class="page-xml__line">
          {{ line.text }}
        </div>
      </div>
    </DisplayFrame>

    <div v-else class="page-xml__image page-xml__body">
      <ThumbnailImage v-if="image.failed" alt="Source image" class="page-xml__pending" />
      <div v-else class="page-xml__stage" v-on="zoom.handlers" @wheel.prevent="zoom.onWheel">
        <div class="page-xml__canvas" :style="zoom.style.value">
          <img
            ref="imageEl"
            :src="previewUrl(image.path)"
            alt="Source image"
            class="page-xml__img"
            @load="onImageLoad"
            @error="image.failed = true"
          />
          <svg
            v-if="image.overlay.width && page.width && page.height"
            class="page-xml__overlay"
            :width="image.overlay.width"
            :height="image.overlay.height"
            :viewBox="`0 0 ${page.width} ${page.height}`"
            preserveAspectRatio="xMidYMid meet"
          >
            <g
              v-for="(line, index) in placedLines"
              :key="line.id || index"
              :class="['page-xml__placed', { 'page-xml__placed--active': index === active }]"
              @mouseenter="active = index"
              @mouseleave="active = null"
            >
              <title>{{ line.text }}</title>
              <polygon :points="line.points" class="page-xml__backing" />
              <text v-bind="textAttrs(line)" class="page-xml__text">{{ line.text }}</text>
            </g>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-xml {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.page-xml__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--md-space-3);
  padding: var(--md-space-2) var(--md-space-4);
  border-block-end: 1px solid var(--md-color-border);
  background: var(--md-color-surface);
}

.page-xml__body {
  flex: 1;
  min-height: 0;
}

.page-xml__region + .page-xml__region {
  margin-block-start: var(--md-space-4);
}

.page-xml__line {
  min-height: 1.5em;
  line-height: 1.5;
  white-space: pre-wrap;
}

.page-xml__zoom {
  display: flex;
  align-items: center;
  gap: var(--md-space-2);
  margin-inline-start: auto;
}

.page-xml__image {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--md-space-4);
  overflow: hidden;
  background: var(--md-color-bg);
}

.page-xml__stage {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  user-select: none;
}

.page-xml__canvas {
  position: relative;
  display: inline-block;
}

.page-xml__img {
  display: block;
  max-width: 100%;
  max-height: calc(100dvh - var(--md-header-height) * 3);
}

.page-xml__overlay {
  position: absolute;
  inset: 0;
}

.page-xml__backing {
  fill: color-mix(in srgb, var(--md-color-surface) 85%, transparent);
  stroke: var(--md-color-primary);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.page-xml__text {
  fill: var(--md-color-text);
  font-family: var(--md-font-title);
}

.page-xml__placed--active .page-xml__backing {
  fill: transparent;
  stroke: var(--md-color-warning);
  stroke-width: 2;
}

.page-xml__placed--active .page-xml__text {
  visibility: hidden;
}

.page-xml__pending {
  max-width: var(--md-card-min-width);
  margin: var(--md-space-6) auto;
}

.page-xml__muted {
  margin: 0;
  font-size: var(--md-font-size-xs);
  color: var(--md-color-text-muted);
}
</style>
