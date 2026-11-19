<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { createFileVersion, revertFileVersion } from '@/api/files.js'
import DisplayFrame from './DisplayFrame.vue'
import { asText, useFileContent } from '../useFileContent.js'
import { fileBrowse } from '@/stores/fileBrowse.js'
import { codePointIndex } from '../roi/textRegions.js'

// Text files, as plain text or rendered Markdown, with in-place editing
// driven by the viewer's quick-edit tools (see the exposed methods).
const props = defineProps({
  file: { type: Object, required: true },
  markdown: { type: Boolean, default: false },
})

const { state, reload } = useFileContent(() => props.file)
const raw = computed(() => asText(state.content))
const html = computed(() =>
  DOMPurify.sanitize(marked.parse(raw.value, { gfm: true, breaks: true })),
)

// A passage opened from the Tags page: the plain text is split around it and it scrolls into view.
const markEl = ref(null)
const focusParts = computed(() => {
  const focus = fileBrowse.focus
  if (!focus || focus.fileRid !== props.file?.['@rid'] || props.markdown) return null
  const text = raw.value
  const index = codePointIndex(text)
  if (!(focus.start >= 0 && focus.end > focus.start && focus.end < index.length)) return null
  return {
    before: text.slice(0, index[focus.start]),
    mid: text.slice(index[focus.start], index[focus.end]),
    after: text.slice(index[focus.end]),
  }
})
watch(
  () => [focusParts.value, state.loading],
  async ([parts]) => {
    if (!parts) return
    await nextTick()
    markEl.value?.scrollIntoView?.({ block: 'center' })
  },
  { immediate: true },
)

const editing = ref(false)
const draft = ref('')

defineExpose({
  startEdit() {
    draft.value = raw.value
    editing.value = true
  },
  cancelEdit() {
    editing.value = false
  },
  async saveEdit() {
    await createFileVersion(props.file['@rid'], { content: draft.value })
    editing.value = false
    await reload()
  },
  async revertEdit() {
    await revertFileVersion(props.file['@rid'])
    editing.value = false
    await reload()
  },
})
</script>

<template>
  <DisplayFrame :loading="state.loading" :error="state.error">
    <v-textarea
      v-if="editing"
      v-model="draft"
      label="Edit text"
      variant="outlined"
      auto-grow
      rows="20"
      class="text-display__editor"
    />
    <!-- Markdown is sanitised with DOMPurify. -->
    <!-- eslint-disable-next-line vue/no-v-html -->
    <article v-else-if="markdown" class="text-display text-display--markdown" v-html="html" />
    <!-- The pre holds exactly the text, so no whitespace may be added between the parts. -->
    <!-- prettier-ignore -->
    <pre v-else-if="focusParts" class="text-display text-display--plain"><span>{{ focusParts.before }}</span><mark ref="markEl" class="text-display__passage">{{ focusParts.mid }}</mark><span>{{ focusParts.after }}</span></pre>
    <pre v-else class="text-display text-display--plain">{{ raw }}</pre>
  </DisplayFrame>
</template>

<style scoped>
.text-display {
  margin: 0;
  max-width: 90ch;
  color: var(--md-color-text);
}

.text-display--plain {
  font-family: var(--md-font-mono);
  font-size: var(--md-font-size-sm);
  white-space: pre-wrap;
  word-break: break-word;
}

.text-display--markdown {
  font-size: var(--md-font-size-md);
  line-height: 1.65;
}

.text-display--markdown :deep(pre) {
  padding: var(--md-space-3);
  border-radius: var(--md-radius-md);
  background: var(--md-color-bg);
  overflow-x: auto;
}

.text-display--markdown :deep(code) {
  font-family: var(--md-font-mono);
}

.text-display__passage {
  background: var(--md-color-primary-soft);
  color: inherit;
  outline: 2px solid var(--md-color-primary);
}

.text-display__editor :deep(textarea) {
  font-family: var(--md-font-mono);
}
</style>
