<template>

  <v-container>
      <v-row>
        <v-btn @click="$router.go(-1)"><v-icon>mdi-arrow-left</v-icon></v-btn>
      </v-row>
      <v-row class="mt-6">
        <div v-if="state.file"><h2>{{ state.file.label }}</h2></div>
        
      </v-row>
      <v-row class="column_image">
        
        <v-col cols="9" >
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
        
        <v-col cols="3">
          <!-- <div v-if="state.file && state.file.rois">{{ state.file.rois }}</div> -->
          
          <v-alert type="info" >Click and drag to create regions of interest (ROI).</v-alert>
          <v-btn v-if="state.ROIs.length > 0" @click="saveROIs2DB" class="mt-3" color="primary">Save ROIs</v-btn>

          <!-- <template v-if="state.cruncher">
            <v-card>
                <v-card-title>{{ state.cruncher.label }}</v-card-title>
                <v-card-text>{{ state.cruncher.info }}</v-card-text>
            </v-card>
            
          </template> -->
        </v-col>  

      </v-row>
    </v-container>


  </template>
  
  <script setup>

    import { onMounted, watch, reactive, ref, computed } from "vue";
    import { useRouter, useRoute } from 'vue-router'
    import ImageSelectArea from 'vue3-image-multiselect-areas';
  
    import web from "../../web.js";

    const route = useRoute();

    var state = reactive({
        file: null,
        cruncher: null,
        ROIs: [],
        width: 400,
        height: 400,
        image_loaded: false
    })

    const image = new Image();

    onMounted(async()=> {

        var response = await web.getDocInfo(route.params.rid)
        
        state.file = response
        state.file.thumbnail = removeLastPathPart(response.path.replace('data/', '/api/thumbnails/'))
        if(route.query.cruncher) {
          var response2 = await web.getDocInfo(route.query.cruncher)
          state.cruncher = response2
        }
        console.log(state.file.thumbnail)
        image.src = state.file.thumbnail; 
        image.onload = () => {
          state.width = image.width;
          state.height = image.height;
          state.image_loaded = true
        };

    })

    async function saveROI(data) {
      state.ROIs = data
    }

    async function saveROIs2DB(data) {
      await web.createROIs(state.file['@rid'], state.ROIs, state.width, state.height)
    }
    function removeLastPathPart(str) {
        const lastIndex = str.lastIndexOf('/');
        if (lastIndex !== -1) {
            return str.substring(0, lastIndex);
        }
        return str;
    }

  </script>
  
  <style >
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
  .column_image {
    height: 90%;
    overflow-y: scroll;
  }
  .delete-button-roi {
    background-color: red;
  }
  </style>