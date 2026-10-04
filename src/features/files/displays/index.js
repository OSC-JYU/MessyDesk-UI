import { defineAsyncComponent } from 'vue'

// Display components by display name (fileTypes.displayFor). Each loads on
// first use, so the viewer only downloads the displays it shows.
export const displays = {
  text: defineAsyncComponent(() => import('./TextDisplay.vue')),
  json: defineAsyncComponent(() => import('./JsonDisplay.vue')),
  pdf: defineAsyncComponent(() => import('./PdfDisplay.vue')),
  image: defineAsyncComponent(() => import('./ImageDisplay.vue')),
  ocr: defineAsyncComponent(() => import('./OcrDisplay.vue')),
  hocr: defineAsyncComponent(() => import('./HocrDisplay.vue')),
  human: defineAsyncComponent(() => import('./HumanJsonDisplay.vue')),
  lines: defineAsyncComponent(() => import('./LineSegmentsDisplay.vue')),
  similarity: defineAsyncComponent(() => import('./SimilarityDisplay.vue')),
  index: defineAsyncComponent(() => import('./IndexDisplay.vue')),
  fields: defineAsyncComponent(() => import('./FieldsDisplay.vue')),
}
