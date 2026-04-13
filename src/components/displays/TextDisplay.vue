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
    <div v-else v-html="state.text"></div>
  </v-sheet>
</template>

<script setup>

  import { onMounted, reactive, ref, watch } from "vue";
  import web from "../../web.js";
  import { store } from "../../components/Store.js";

  const textContainer = ref(null)

  const emit = defineEmits(['change-tab', 'save-edit', 'revert-edit'])
  const props = defineProps(['tab'])

  watch(() => props.tab, async () => { await load() })
  watch(() => store.file, async (newFile) => { if (newFile) await load() })

  var state = reactive({
    file: null,
    text: '',
    textRaw: '',
    editMode: false,
    editText: ''
  })

  function replaceWithBr(text) {
    if (typeof text == 'string') {
      return text.replace(/\n/g, "<br />")
    } else {
      return text
    }
  }

  async function load() {
    state.file = store.file
    state.editMode = false
    state.editText = ''

    var f = await web.getNodeFile(store.file['@rid'])
    state.textRaw = typeof f === 'string' ? f : JSON.stringify(f, null, 2)
    state.text = replaceWithBr(f)
  }

  function startTextEdit() {
    state.editMode = true
    state.editText = state.textRaw
  }

  function cancelTextEdit() {
    state.editMode = false
    state.editText = state.textRaw
  }

  async function saveTextEdit() {
    if (!state.file || !state.file['@rid']) return
    await web.createFileVersion(state.file['@rid'], { content: state.editText })
    await load()
  }

  async function revertTextEdit() {
    if (!state.file || !state.file['@rid']) return
    await web.revertFileVersion(state.file['@rid'])
    await load()
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
</style>