<template>
  <v-sheet class="text-content pa-4" ref="textContainer">
    <v-textarea
      v-if="state.editMode"
      v-model="state.editText"
      auto-grow
      rows="20"
      variant="outlined"
      label="Edit text"
    ></v-textarea>
    <div
      v-else
      class="rendered-text"
      :class="{ 'plain-text': !props.markdownEnabled }"
      v-html="state.text"
    ></div>
  </v-sheet>
</template>

<script setup>

  import { onMounted, reactive, ref, watch } from "vue";
  import { marked } from "marked";
  import DOMPurify from "dompurify";
  import web from "../../web.js";
  import { store } from "../../components/Store.js";

  const textContainer = ref(null)
  let loadToken = 0

  marked.setOptions({
    gfm: true,
    breaks: true,
  })

  defineEmits(['change-tab', 'save-edit', 'revert-edit'])
  const props = defineProps({
    tab: { type: [String, Number], default: null },
    markdownEnabled: { type: Boolean, default: false },
  })

  watch(() => props.tab, async () => { await load() })
  watch(() => props.markdownEnabled, () => { updateRenderedText() })
  watch(() => store.file, async (newFile) => { if (newFile) await load() })

  var state = reactive({
    file: null,
    text: '',
    textRaw: '',
    editMode: false,
    editText: ''
  })

  function replaceWithBr(text) {
    if (typeof text !== 'string') return text
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  function renderMarkdown(text) {
    if (typeof text !== 'string') return ''
    const rendered = marked.parse(text)
    return DOMPurify.sanitize(rendered)
  }

  function updateRenderedText() {
    if (props.markdownEnabled) {
      state.text = renderMarkdown(state.textRaw)
      return
    }
    state.text = replaceWithBr(state.textRaw)
  }

  async function load() {
    if (!store.file || !store.file['@rid']) return

    const token = ++loadToken
    state.file = store.file
    state.editMode = false
    state.editText = ''

    var f = await web.getNodeFile(store.file['@rid'])
    if (token !== loadToken) return

    const serialized = typeof f === 'string' ? f : JSON.stringify(f, null, 2)
    state.textRaw = typeof serialized === 'string' ? serialized : ''
    updateRenderedText()
  }

  function startTextEdit() {
    state.editMode = true
    state.editText = typeof state.textRaw === 'string' ? state.textRaw : ''
  }

  function cancelTextEdit() {
    state.editMode = false
    state.editText = ''
  }

  async function saveTextEdit() {
    if (!state.file || !state.file['@rid']) return
    const contentToSave = typeof state.editText === 'string'
      ? state.editText
      : (typeof state.textRaw === 'string' ? state.textRaw : '')
    await web.createFileVersion(state.file['@rid'], { content: contentToSave })
    await load()
    state.editMode = false
  }

  async function revertTextEdit() {
    if (!state.file || !state.file['@rid']) return
    await web.revertFileVersion(state.file['@rid'])
    await load()
    state.editMode = false
  }

  defineExpose({ startTextEdit, cancelTextEdit, saveTextEdit, revertTextEdit })

  onMounted(async () => {
    await load()
  })
</script>

<style scoped>
.text-content {
  background-color: white;
  min-height: 100%;
  height: calc(100vh - 120px);
  overflow-y: auto;
}

.rendered-text :deep(pre) {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
}

.rendered-text :deep(code) {
  font-family: var(--md-font-mono);
}

.rendered-text.plain-text {
  font-family: var(--md-font-mono);
  white-space: pre-wrap;
  word-break: break-word;
}
</style>