<template>

  <v-container>

    <v-btn
        class="ma-2"
        color="primary"
        icon="mdi-close"
        style="position: absolute; top: 0; left: -60px; z-index:1000"
        @click="$emit('change-tab',0)"
      ></v-btn>
      <v-row class="column_base">

        <v-col cols="9" class="column_image ">
          <!-- <img v-if="state.file" :src="state.file.thumbnail" alt="Image" />  -->
          <image-select-area v-if="state.file && state.image_loaded"
          :image-url="state.file.thumbnail"
          :width="state.width"
          :height="state.height"
          border-color="red"
          border-width="4"
          @save-data="saveROI"
          :init-areas="state.file.rois"
          />
        </v-col>
        
        <v-col cols="3" class="column_image">
          <!-- <div v-if="state.file && state.file.rois">{{ state.file.rois }}</div> -->
          <div v-if="state.file">
            <h3>{{ state.file.label }}</h3>
            <DescriptionEditor :description="state.file.description" :rid="state.file['@rid']"/>
          </div>
          
          <v-alert type="info" >Click and drag to create saved selections (ROI).</v-alert>

          <template v-if="state.ROIs.length > 0">
            <v-list density="compact" >
              <v-list-subheader>Saved selections</v-list-subheader>

              <v-list-item
                v-for="(item, i) in state.ROIs"
                :key="i"
                :value="item"
                color="primary"
              >
                <template v-slot:prepend>
                  <v-icon icon="mdi-selection mdi"></v-icon>
                </template>

                <v-list-item-title v-text="item.comment"></v-list-item-title>
              </v-list-item>
            </v-list>
          </template>
          <template v-else> 
            
            <v-list density="compact" v-if="state.file">
              <v-list-subheader>Saved selections</v-list-subheader>

              <v-list-item
                v-for="(item, i) in state.file.rois"
                :key="i"
                :value="item"
                color="primary"
              >
                <template v-slot:prepend>
                  <v-icon icon="mdi-selection mdi"></v-icon>
                </template>

                <v-list-item-title v-text="item.comment"></v-list-item-title>
              </v-list-item>
            </v-list>

          </template>



          <template v-if="state.ROIs.length > 0">

            <v-alert type="warning" >unsaved changes!</v-alert>
          
            <v-btn @click="saveROIs2DB" class="mt-3" color="primary">Save selections</v-btn>
          </template>


        </v-col>  

      </v-row>
    </v-container>


  </template>
  
  <script setup>

    import { onMounted, watch, reactive, ref, computed } from "vue";
    import ImageSelectArea from 'vue3-image-multiselect-areas';
  
    import web from "../../web.js";
    import {store} from "../../components/Store.js";

    import DescriptionEditor from './DescriptionEditor.vue'

    // tab controls
    const emit = defineEmits(['change-tab'])
    const props = defineProps(['tab'])
    // tab change launces content update. Could be done otherwise probaply?
    watch(() => props.tab, async (newValue, oldValue) => {
      await load()
    })

    var state = reactive({
        file: null,
        cruncher: null,
        ROIs: [],
        width: 400,
        height: 400,
        image_loaded: false
    })

    const image = new Image();

    async function load() { 
      
      state.ROIs = []
      state.file = null
      var response = await web.getDocInfo(store.file['@rid'])
      state.file = response
      state.file.thumbnail = removeLastPathPart('api/thumbnails/' + response.path)

      image.src = state.file.thumbnail; 
      image.onload = () => {
        state.width = image.width;
        state.height = image.height;
        state.image_loaded = true
      };
    }

    onMounted(async()=> {

      await load()

    })

    async function saveROI(data) {
      state.ROIs = data
    }

    async function saveROIs2DB(data) {
      await web.createROIs(state.file['@rid'], state.ROIs, state.width, state.height)
      state.ROIs = []
    }
    function removeLastPathPart(str) {
        const lastIndex = str.lastIndexOf('/');
        if (lastIndex !== -1) {
            return str.substring(0, lastIndex);
        }
        return str;
    }

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
  .delete-button {
    color: red;
  }
  canvas {
    background-color: none;
  }
  .column_base {
    height: 90%; 
  }
  .column_image {
    height: 100%;
    overflow-y: scroll;
  }
  .paper {
  border: 1px solid black;
  background-color: white;
}
  .delete-button-roi {
    background-color: red;
  }
  .v-container {
  max-width: 1600px;
  margin-left:100px;
}
  </style>