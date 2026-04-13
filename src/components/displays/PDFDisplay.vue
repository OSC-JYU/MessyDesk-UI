<template>
  <v-sheet class="pdf-content fill-height">
    <iframe v-if="state.rid" :src="state.rid" width="100%" height="100%"></iframe>
  </v-sheet>
</template>
  
<script setup>
  import { onMounted, reactive, watch } from "vue";
  import web from "../../web.js";
  import { store } from "../../components/Store.js";
  const apiUrl = import.meta.env.VITE_API_PATH;

  const emit = defineEmits(['change-tab'])
  const props = defineProps(['tab'])

  watch(() => props.tab, async () => { await load() })
  watch(() => store.file, async (newFile) => { if (newFile) await load() })

  var state = reactive({
    file: null,
    rid: null
  })

  async function load() {
    if (!store.file || !store.file['@rid']) return
    state.file = store.file
    state.rid = apiUrl + "/api/files/" + store.file['@rid'].replace('#', '')
  }

  onMounted(async () => {
    await load()
  })
</script>
  
<style scoped>
.pdf-content {
  height: calc(100vh - 120px);
}

iframe {
  border: none;
}
</style>