<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createFileVersion } from '@/api/files.js'
import DisplayFrame from './DisplayFrame.vue'
import { asText, useFileContent } from '../useFileContent.js'

// A note: a markdown file written directly in the viewer. It saves by itself a moment after the
// last key press, when the viewer moves to another file and when it is left; the button saves
// at once.
const props = defineProps({
  file: { type: Object, required: true },
})

const AUTOSAVE_MS = 1500

const { state } = useFileContent(() => props.file)
const draft = ref('')
const saved = ref('')
const status = ref('saved') // saved | dirty | saving | error
const error = ref(null)
let timer = null

watch(
  () => state.loading,
  (loading) => {
    if (loading || state.content === null) return
    draft.value = saved.value = asText(state.content)
    status.value = 'saved'
  },
  { immediate: true },
)

const loaded = computed(() => !state.loading && state.content !== null)

function onInput() {
  status.value = draft.value === saved.value ? 'saved' : 'dirty'
  clearTimeout(timer)
  if (status.value === 'dirty') timer = setTimeout(save, AUTOSAVE_MS)
}

async function save() {
  clearTimeout(timer)
  if (!loaded.value || draft.value === saved.value || status.value === 'saving') return
  const text = draft.value
  status.value = 'saving'
  error.value = null
  try {
    await createFileVersion(props.file['@rid'], { content: text })
    saved.value = text
    status.value = draft.value === text ? 'saved' : 'dirty'
    if (status.value === 'dirty') timer = setTimeout(save, AUTOSAVE_MS)
  } catch (e) {
    error.value = e
    status.value = 'error'
  }
}

// Leaving the file or the page: the save is not awaited.
function saveOnLeave() {
  clearTimeout(timer)
  if (loaded.value && draft.value !== saved.value) {
    createFileVersion(props.file['@rid'], { content: draft.value }).catch(() => {})
    saved.value = draft.value
  }
}

onMounted(() => window.addEventListener('pagehide', saveOnLeave))
onBeforeUnmount(() => {
  window.removeEventListener('pagehide', saveOnLeave)
  saveOnLeave()
})

const indicator = computed(
  () =>
    ({
      saved: { icon: 'mdi-check-circle-outline', text: 'Saved', color: 'success' },
      dirty: { icon: 'mdi-pencil-outline', text: 'Not saved yet', color: 'warning' },
      saving: { icon: 'mdi-progress-clock', text: 'Saving…', color: 'info' },
      error: { icon: 'mdi-alert-circle-outline', text: 'Could not save', color: 'error' },
    })[status.value],
)
</script>

<template>
  <DisplayFrame :loading="state.loading" :error="state.error">
    <div class="note">
      <div class="note__bar">
        <v-chip
          :prepend-icon="indicator.icon"
          :color="indicator.color"
          size="small"
          variant="tonal"
          label
          role="status"
          >{{ indicator.text }}</v-chip
        >
        <v-spacer />
        <v-btn
          size="small"
          color="primary"
          variant="flat"
          prepend-icon="mdi-content-save-outline"
          :disabled="status === 'saved' || status === 'saving'"
          @click="save"
          >Save</v-btn
        >
      </div>
      <v-alert v-if="error" type="error" density="compact" variant="tonal" class="mb-2">{{
        error?.message || 'The note could not be saved.'
      }}</v-alert>
      <v-textarea
        v-model="draft"
        label="Note"
        placeholder="Write a note in Markdown…"
        variant="outlined"
        auto-grow
        rows="16"
        hide-details
        class="note__editor"
        @update:model-value="onInput"
        @keydown.ctrl.s.prevent="save"
        @keydown.meta.s.prevent="save"
        @blur="save"
      />
    </div>
  </DisplayFrame>
</template>

<style scoped>
.note {
  max-width: 90ch;
}

.note__bar {
  display: flex;
  align-items: center;
  gap: var(--md-space-3);
  margin-block-end: var(--md-space-3);
}

.note__editor :deep(textarea) {
  font-family: var(--md-font-mono);
  line-height: 1.6;
}
</style>
