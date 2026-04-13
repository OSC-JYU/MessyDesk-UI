<template>
  <v-sheet class="json-content pa-4">
    <pre>{{ state.text }}</pre>
  </v-sheet>
</template>

<script setup>
  import { onMounted, reactive, watch } from "vue";
  import web from "../../web.js";
  import { store } from "../../components/Store.js";

  const emit = defineEmits(['change-tab'])
  const props = defineProps(['tab'])

  watch(() => props.tab, async () => {
    await load()
  })

  watch(() => store.file, async (newFile) => {
    if (newFile) await load()
  })

  var state = reactive({
    file: null,
    text: ''
  })

  async function load() {
    state.file = store.file
    var f = await web.getNodeFile(store.file['@rid'])
    try {
      state.text = JSON.stringify(f, null, 2)
    } catch (e) {
      state.text = f
    }
  }

  onMounted(async () => {
    await load()
  })
</script>

<style scoped>
.json-content {
  background-color: white;
  min-height: 100%;
  overflow-y: auto;
  height: calc(100vh - 120px);
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>