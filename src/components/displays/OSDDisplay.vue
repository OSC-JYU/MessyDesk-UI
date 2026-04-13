<template>
  <v-sheet class="osd-content pa-4">
    <div v-html="state.text"></div>
  </v-sheet>
</template>

<script setup>
  import { onMounted, reactive, watch } from "vue";
  import web from "../../web.js";
  import { store } from "../../components/Store.js";

  const emit = defineEmits(['change-tab'])
  const props = defineProps(['tab'])

  watch(() => props.tab, async () => { await load() })
  watch(() => store.file, async (newFile) => { if (newFile) await load() })

  var state = reactive({ text: '' })

  async function load() {
    var text = await web.getNodeFile(store.file['@rid'])
    state.text = replaceWithBr(JSON.stringify(text, null, 2))
  }

  onMounted(async () => { await load() })

  function replaceWithBr(text) {
    return text.replace(/\n/g, "<br />")
  }
</script>

<style scoped>
.osd-content {
  height: calc(100vh - 120px);
  overflow-y: auto;
  background-color: white;
}

  </style>