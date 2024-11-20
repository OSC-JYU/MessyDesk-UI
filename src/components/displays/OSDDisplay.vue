<template>
    <v-container>
      <v-btn
        class="ma-2"
        color="primary"
        icon="mdi-close"
        style="position: absolute; top: 0; left: -60px; z-index:1000"
        @click="$emit('change-tab',0)"
      ></v-btn>
      <v-row class="mt-6">
        <div v-if="state.file"><h2>{{ state.file.label }}</h2></div>
      </v-row>
      <v-row>

        <v-col cols="9" >
          <div v-html="state.text"></div>
        </v-col>

        <v-col cols="3">

        </v-col>  

      </v-row>
    </v-container>

    
  </template>
  
  <script setup>

    import { onMounted, watch, reactive} from "vue";
  
    import web from "../../web.js";
    import {store} from "../../components/Store.js";

    const emit = defineEmits(['change-tab'])
    const props = defineProps(['tab'])
    // tab change launces content update. Could be done otherwise propably?
    watch(() => props.tab, async (newValue, oldValue) => {
      await load()
    })

    var state = reactive({
        file: null,
        cruncher: null
    })

    async function load() {
      var text =  await web.getNodeFile(store.file['@rid'])
      state.text = replaceWithBr(JSON.stringify(text, null, 2))
      state.file = await web.getDocInfo(store.file['@rid'])

    }

    onMounted(async()=> {
      await load()
    })

    function replaceWithBr(text) {
      return text.replace(/\n/g, "<br />")
    }

  </script>
  
  <style scoped>

  </style>