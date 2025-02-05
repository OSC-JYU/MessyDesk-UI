<template>
    <v-container>
      <v-btn
        class="ma-2"
        color="primary"
        icon="mdi-close"
        style="position: absolute; top: 0; left: -60px; z-index:1000"
        @click="$emit('change-tab',0)"
      ></v-btn>

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
    const apiUrl = import.meta.env.VITE_API_PATH;

    // tab controls
    const emit = defineEmits(['change-tab'])
    const props = defineProps(['tab'])
    // tab change launces content update. Could be done otherwise propably?
    watch(() => props.tab, async (newValue, oldValue) => {
      state.rid = apiUrl + "/api/files/" + store.file['@rid'].replace('#', '')
    })

    var state = reactive({
        file: null,
        cruncher: null,
        rid: null
    })

    onMounted(async()=> {
        state.rid = apiUrl + "/api/files/" + store.file['@rid'].replace('#', '')
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

  .v-container {
  max-width: 1600px;
  margin-left:100px;
}
  </style>