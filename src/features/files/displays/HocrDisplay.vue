<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import DOMPurify from 'dompurify'
import DisplayFrame from './DisplayFrame.vue'
import { useFileContent, asText } from '../useFileContent.js'
import { sourceImageOf } from '../sourceImage.js'
import { fileUrl } from '../fileUrls.js'
import { bboxFromTitle, hocrBody } from '../hocr.js'

// hOCR proofreading view: the page image on the left; on the right each OCR
// line with the matching strip cut from the image above it. Clicking a
// word turns it into an input (edits are not saved yet, as before).
const props = defineProps({ file: { type: Object, required: true } })

const { state } = useFileContent(() => props.file)
const html = computed(() => DOMPurify.sanitize(hocrBody(asText(state.content))))
const pageImage = ref(null)
const imageSrc = ref('')
const editor = ref(null)

watch(
  () => props.file['@rid'],
  async () => {
    const source = await sourceImageOf(props.file).catch(() => null)
    imageSrc.value = source ? fileUrl(source['@rid']) : ''
  },
  { immediate: true },
)

// Puts a strip of the page image above each OCR line.
async function addLineImages() {
  await nextTick()
  const img = pageImage.value
  if (!img || !editor.value) return
  const scale = img.naturalWidth / 800
  for (const line of editor.value.querySelectorAll('.ocr_line, .ocr_textfloat')) {
    const box = bboxFromTitle(line.title)
    if (!box || line.previousElementSibling?.tagName === 'CANVAS') continue
    const canvas = document.createElement('canvas')
    canvas.width = box.width / scale
    canvas.height = box.height / scale
    canvas
      .getContext('2d')
      ?.drawImage(img, box.x, box.y, box.width, box.height, 0, 0, canvas.width, canvas.height)
    line.parentNode.insertBefore(canvas, line)
  }
}

function onClick(event) {
  const word = event.target
  if (!word.classList?.contains('ocrx_word') || word.querySelector('input')) return
  const input = document.createElement('input')
  input.className = 'hocr__word-input'
  input.value = word.textContent
  input.style.width = `${Math.max(2, input.value.length * 0.8)}em`
  word.textContent = ''
  word.appendChild(input)
  input.focus()
  input.select()
}
</script>

<template>
  <div class="hocr">
    <div class="hocr__image">
      <img v-if="imageSrc" ref="pageImage" :src="imageSrc" alt="Page image" @load="addLineImages" />
      <p v-else class="hocr__muted">No source image found for this OCR file.</p>
    </div>
    <DisplayFrame :loading="state.loading" :error="state.error" class="hocr__text">
      <!-- hOCR markup is sanitised with DOMPurify. -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div ref="editor" class="hocr__page" @click="onClick" v-html="html" />
    </DisplayFrame>
  </div>
</template>

<style scoped>
.hocr {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100%;
}

.hocr__image {
  overflow: auto;
  padding: var(--md-space-4);
  border-inline-end: 1px solid var(--md-color-border);
  background: var(--md-color-bg);
}

.hocr__image img {
  width: 100%;
}

.hocr__muted {
  color: var(--md-color-text-muted);
}

.hocr__page {
  font-family: var(--md-font-title);
}

.hocr__page :deep(.ocr_line) {
  display: flex;
  justify-content: space-between;
  margin-block-end: var(--md-space-4);
}

.hocr__page :deep(.ocr_textfloat) {
  display: block;
  margin-block-end: var(--md-space-4);
}

.hocr__page :deep(.ocrx_word) {
  cursor: text;
}

.hocr__page :deep(.hocr__word-input) {
  border-bottom: 1px solid var(--md-color-primary);
  font: inherit;
}
</style>
