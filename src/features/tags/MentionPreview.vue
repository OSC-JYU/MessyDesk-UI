<script setup>
import { nextTick, reactive, ref, watch } from 'vue'
import { getNodeFile } from '@/api/files.js'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import LoadingState from '@/ui/LoadingState.vue'
import { markedHtml } from '@/features/search/results.js'

// The text of the file a mention was found in, with the mention marked and
// scrolled into view.
const props = defineProps({
  hit: { type: Object, required: true }, // { file_rid, file_label, start, end }
  mention: { type: String, default: '' },
})

const emit = defineEmits(['close', 'open-file'])
const state = reactive({ html: '', loading: true, error: null })
const body = ref(null)

watch(
  () => props.hit,
  async (hit) => {
    state.loading = true
    state.error = null
    try {
      const content = await getNodeFile(hit.file_rid)
      if (hit !== props.hit) return
      state.html = markedHtml(content, hit.start, hit.end)
    } catch {
      state.error = 'Could not load the file content.'
    } finally {
      state.loading = false
    }
    await nextTick()
    body.value?.querySelector('mark')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  },
  { immediate: true },
)
</script>

<template>
  <section class="mention-preview" aria-label="Mention in its file">
    <header class="mention-preview__head">
      <div>
        <h2 class="mention-preview__file">{{ hit.file_label }}</h2>
        <p class="mention-preview__mention">“{{ mention }}”</p>
      </div>
      <div>
        <v-btn
          variant="text"
          size="small"
          prepend-icon="mdi-open-in-app"
          @click="emit('open-file', hit)"
          >Open file</v-btn
        >
        <v-btn
          icon="mdi-close"
          size="small"
          variant="text"
          aria-label="Close preview"
          @click="emit('close')"
        />
      </div>
    </header>
    <div ref="body" class="mention-preview__body">
      <LoadingState v-if="state.loading" text="Loading the file…" />
      <ErrorAlert v-else-if="state.error" :error="state.error" title="" />
      <!-- markedHtml escapes the file text; only the <mark> is HTML. -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-else class="mention-preview__text" v-html="state.html" />
    </div>
  </section>
</template>

<style scoped>
.mention-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--md-color-surface);
}

.mention-preview__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--md-space-3);
  padding: var(--md-space-3) var(--md-space-5);
  border-bottom: 1px solid var(--md-color-border);
}

.mention-preview__file {
  margin: 0;
  font-size: var(--md-font-size-lg);
}

.mention-preview__mention {
  margin: 0;
  color: var(--md-color-text-muted);
}

.mention-preview__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--md-space-4) var(--md-space-5);
}

.mention-preview__text {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--md-font-mono);
  font-size: var(--md-font-size-sm);
}

.mention-preview__text :deep(mark) {
  padding: 0 var(--md-space-1);
  border-radius: var(--md-radius-sm);
  background: var(--md-color-highlight);
}
</style>
