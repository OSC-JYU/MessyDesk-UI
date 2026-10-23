<script setup>
import { computed, ref, watch } from 'vue'
import { getFileAncestors } from '@/api/projects.js'
import DisplayFrame from './DisplayFrame.vue'
import { useFileContent } from '../useFileContent.js'
import { previewUrl } from '../fileUrls.js'
import { parseOcrRegions } from '../ocr.js'
import ThumbnailImage from '@/ui/ThumbnailImage.vue'

// OCR result: the source image, and the recognised text pieces. Hovering a
// piece of text shows where it is on the image.
const props = defineProps({ file: { type: Object, required: true } })
const { state } = useFileContent(() => props.file)
const regions = computed(() => parseOcrRegions(state.content))
const imagePath = ref('')
const hovered = ref(-1)

watch(
  () => props.file['@rid'],
  async (rid) => {
    imagePath.value = props.file.type === 'image' ? props.file.path : ''
    try {
      const ancestors = (await getFileAncestors(rid)) || []
      const image = ancestors.find((a) => a.type === 'image')
      if (image) imagePath.value = image.path
    } catch {
      // No source image: the text is still shown.
    }
  },
  { immediate: true },
)

function regionStyle(region) {
  return {
    left: `${region.left * 100}%`,
    top: `${region.top * 100}%`,
    width: `${region.width * 100}%`,
    height: `${region.height * 100}%`,
  }
}
</script>

<template>
  <div class="ocr">
    <div class="ocr__image">
      <div v-if="imagePath" class="ocr__stage">
        <ThumbnailImage :src="previewUrl(imagePath)" alt="Source image" class="ocr__img" />
        <div
          v-for="(region, index) in regions"
          v-show="hovered === index"
          :key="index"
          class="ocr__region"
          :style="regionStyle(region)"
        />
      </div>
      <p v-else class="ocr__muted">No source image found.</p>
    </div>
    <DisplayFrame :loading="state.loading" :error="state.error">
      <p v-if="!regions.length" class="ocr__muted">No text was recognised.</p>
      <span
        v-for="(region, index) in regions"
        :key="index"
        class="ocr__piece"
        :title="region.confidence != null ? `Confidence ${region.confidence}` : undefined"
        @mouseenter="hovered = index"
        @mouseleave="hovered = -1"
      >
        {{ region.text }}
      </span>
    </DisplayFrame>
  </div>
</template>

<style scoped>
.ocr {
  display: grid;
  grid-template-columns: 5fr 7fr;
  height: 100%;
}

.ocr__image {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: var(--md-space-4);
  overflow: auto;
  border-inline-end: 1px solid var(--md-color-border);
  background: var(--md-color-bg);
}

.ocr__stage {
  position: relative;
  display: inline-block;
}

.ocr__img {
  max-width: 100%;
}

.ocr__region {
  position: absolute;
  border: 2px solid var(--md-color-error);
  background: color-mix(in srgb, var(--md-color-error) 20%, transparent);
  pointer-events: none;
}

.ocr__piece {
  display: inline-block;
  margin: var(--md-space-1);
  padding: var(--md-space-1) var(--md-space-2);
  border-radius: var(--md-radius-sm);
  background: var(--md-color-bg);
  cursor: default;
}

.ocr__piece:hover {
  background: color-mix(in srgb, var(--md-color-error) 12%, var(--md-color-bg));
}

.ocr__muted {
  color: var(--md-color-text-muted);
}
</style>
