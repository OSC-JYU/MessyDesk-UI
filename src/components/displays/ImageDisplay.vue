<template>

  <v-container>
      <v-row>
        <v-btn @click="$router.go(-1)"><v-icon>mdi-arrow-left</v-icon></v-btn>
      </v-row>
      <v-row class="mt-6">
        <div v-if="state.file"><h2>{{ state.file.label }}</h2></div>
      </v-row>
      <v-row>

        <v-col cols="9" >
          <!-- <img v-if="state.file" :src="state.file.thumbnail" alt="Image" />  -->
          <image-select-area v-if="state.file"
            :image-url="state.file.thumbnail"
            :width="900"
            :height="700"
            border-color="#0FB839"
            border-width="2"
            @save-data="saveROI"
          />
        </v-col>

        <v-col cols="3">
          {{ state.ROIs }}
          <template v-if="state.cruncher">
            <v-card>
                <v-card-title>{{ state.cruncher.label }}</v-card-title>
                <v-card-text>{{ state.cruncher.info }}</v-card-text>
            </v-card>
          </template>
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
        ROIs: []
    })

    onMounted(async()=> {

        var response = await web.getDocInfo(route.params.rid)
        
        state.file = response
        state.file.thumbnail = removeLastPathPart(response.path.replace('data/', '/api/thumbnails/'))
        if(route.query.cruncher) {
          var response2 = await web.getDocInfo(route.query.cruncher)
          state.cruncher = response2
        }
    })

    async function saveROI(data) {
      console.log(data)
      state.ROIs.push(data)

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
  </style>