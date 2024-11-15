<template>
    <v-container>
      <v-row>
        <v-btn @click="$emit('change-tab',0)"><v-icon>mdi-arrow-left</v-icon></v-btn>
      </v-row>
      <v-row class="mt-6">
        <div v-if="state.file"><h2>{{ state.file.label }}</h2></div>
      </v-row>
      <v-row class="h-100">

        <v-col cols="12" fill-height>
          <iframe :src="state.rid" width="100%" height="100%"></iframe>
        </v-col>
      </v-row>
    </v-container>

  </template>
  
  <script setup>

    import { onMounted, watch, reactive, ref, computed} from "vue";
    import {store} from "../../components/Store.js";

    // tab controls
    const emit = defineEmits(['change-tab'])
    const props = defineProps(['tab'])
    // tab change launces content update. Could be done otherwise propably?
    watch(() => props.tab, async (newValue, oldValue) => {
      state.rid = "/api/files/" + store.file['@rid'].replace('#', '')
    })

    var state = reactive({
        file: null,
        cruncher: null,
        rid: null
    })

    onMounted(async()=> {
        state.rid = "/api/files/" + store.file['@rid'].replace('#', '')
    })

  </script>
  
  <style scoped>
  .container {
    display: flex;
  }
  
  .column {
    flex: 1;
  }
  
  .column img {
    max-width: 100%;
    height: auto;
  }
  </style>