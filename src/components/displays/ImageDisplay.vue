<style scoped>
  .v-chip {
    margin: 2px;
  }
  .header {
    color: white;
    text-decoration: none;
    background-color: #54546f;
  }

  .options {
    background-color: #ebedf2;
  }
</style>

<template>

  <v-container>

    <v-btn
        class="ma-2"
        color="primary"
        icon="mdi-close"
        style="position: absolute; top: 0; left: -60px; z-index:1000"
        @click="$emit('change-tab',store.tab)" 
      ></v-btn>
      <v-row class="column_base">

        <v-col cols="9" class="column_image ">
          <img v-if="state.file" :src="state.file.thumbnail" alt="Image" /> 
          <!-- <image-select-area v-if="state.file && state.image_loaded"
          :image-url="state.file.thumbnail"
          :width="state.width"
          :height="state.height"
          border-color="red"
          border-width="4"
          @save-data="saveROI"
          :init-areas="state.file.rois"
          /> -->
        </v-col>
        
        <v-col cols="3" class="column_image"  >
          <!-- <div v-if="state.file && state.file.rois">{{ state.file.rois }}</div> -->

        <!-- Set browse arrows -->
          <template v-if="state.file_count > 0">
            <v-btn @click="prev()" :disabled="state.skip == 1"><v-icon>mdi-chevron-left</v-icon></v-btn>
          {{state.skip }} / {{state.file_count}} 
          <v-btn @click="next()" :disabled="state.skip == state.file_count"><v-icon>mdi-chevron-right</v-icon></v-btn>
          </template>



          <div v-if="state.file" class="mb-6">
            <div class="header pa-2">{{ state.file.label }}</div>
       
            <DescriptionEditor :description="state.file.description" :rid="state.file['@rid']"/>

            <!-- list of entities -->
 
             <v-sheet>
              <v-chip @click="deleteOrOpenEntity($event, entity.rid)" v-for="entity of state.file.entities" :key="entity.type" :color="entity.color" variant="outlined" >
                <v-icon :icon="'mdi-' + entity.icon.toLowerCase()" start></v-icon> {{ entity.label}}
                <v-icon v-if="state.isCtrlPressed" icon="mdi-close-circle" end></v-icon>
                
              </v-chip>
              <p v-if="state.file.entities && state.file.entities.length" class="font-weight-bold">Ctrl + click to remove</p>
             </v-sheet>

          </div>
          

          <!-- <v-alert type="info" >Click and drag to create saved selections (ROI).</v-alert>-->
          
          
          <v-list v-model:opened="state.open" class="options">
            
            <v-list-group value="Tags">
              <template v-slot:activator="{ props }">
                <v-list-item
                  v-bind="props"
          
                  title="Tags"
                ></v-list-item>
              </template>

              <v-list-group color="primary" v-for="type in state.entities" :key="type.type">
                <template v-slot:activator="{ props }">
                  <v-list-item
                    v-bind="props"
                    :title="type.type"
                    :prepend-icon="'mdi-' + type.icon"
                  ></v-list-item>
                </template>
                <v-chip @click="linkEntityToItem(item['@rid'])" v-for="item in type.items" :key="item['@rid']" :color="item.color" ><v-icon :icon="'mdi-' + item.icon.toLowerCase()" start></v-icon> {{ item.label }}</v-chip>

              </v-list-group>
            </v-list-group>
        

            <!-- <v-list-group value="Selections">
              <template v-slot:activator="{ props }">
                <v-list-item
                  v-bind="props"
                  title="Selections"
                ></v-list-item>
              </template>

              <template v-if="state.ROIs.length > 0">
                  <v-list density="compact" >


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
            </v-list-group> -->
          </v-list>



          
            <a v-if="state.file" class="text-medium-emphasis" title="open file in browser tab" target="_blank" :href="apiUrl + '/api/files/' + state.file['@rid'].replace('#','')">
              <v-btn  color="primary" class="mt-3">open full file</v-btn>
            </a> 
       

         





          <template v-if="state.ROIs.length > 0">

            <v-alert type="warning" >unsaved changes!</v-alert>
          
            <v-btn @click="saveROIs2DB" class="mt-3" color="primary">Save selections</v-btn>
          </template>


        </v-col>  

      </v-row>
    </v-container>


  </template>
  
  <script setup>

    import { onMounted, onUnmounted, watch, reactive, ref, computed } from "vue";
    import ImageSelectArea from 'vue3-image-multiselect-areas';
  
    import web from "../../web.js";
    import {store} from "../../components/Store.js";

    import DescriptionEditor from './DescriptionEditor.vue'
    const apiUrl = import.meta.env.VITE_API_PATH

    // tab controls
    const emit = defineEmits(['change-tab'])
    const props = defineProps(['tab'])

    // tab change launces content update. Could be done otherwise probaply?
    // WARINING! tab is harcoded!
    watch(() => props.tab, async (newValue, oldValue) => {
      if(newValue == 3) await load()
    })

    var state = reactive({
        file: null,
        cruncher: null,
        ROIs: [],
        width: 400,
        height: 400,
        image_loaded: false,
        skip: 0,
        file_count: 0,
        panels: [0,0],
        entities: {},
        isCtrlPressed: false
        
    })

    const image = new Image();

    async function prev() {
      if((state.skip -1) < 1) return
      state.ROIs = []
      state.skip = state.skip - 1
      var response = await web.getSetFiles(store.current_node.id, state.skip - 1, 1)
      state.file = response.files[0]
      state.file.thumbnail = removeLastPathPart('/api/thumbnails/' + state.file.path)
      image.src = state.file.thumbnail; 
    }

    async function next() {
      if((state.skip ) > state.file_count) return
      state.ROIs = []
      state.skip = state.skip + 1
      var response = await web.getSetFiles(store.current_node.id, state.skip -1 , 1)
      //var response2 = await web.getDocInfo(response.files[0]['@rid'])
      state.file = response.files[0]
      state.file.thumbnail = removeLastPathPart('/api/thumbnails/' + state.file.path)
      image.src = state.file.thumbnail; 
    }

    async function linkEntityToItem(entityID) {
      console.log(entityID)
      console.log(state.file['@rid'])
      await web.linkEntityToItem(entityID, state.file['@rid'])
      var response = await web.getDocInfo(state.file['@rid'])
      state.file = response
      state.file.thumbnail = removeLastPathPart('/api/thumbnails/' + response.path)
    }

    async function unLinkEntity(entityID) {
      console.log(entityID)
      console.log(state.file['@rid'])
      await web.unLinkEntity(entityID, state.file['@rid'])
      var response = await web.getDocInfo(state.file['@rid'])
      state.file = response
      state.file.thumbnail = removeLastPathPart('/api/thumbnails/' + response.path)
    }

    async function deleteOrOpenEntity(event, entityID) {
      if (state.isCtrlPressed) {
        await unLinkEntity(entityID)
      } else {
        console.log('show');
      }
    }

    async function load() { 
      
      state.ROIs = []
      state.file = null
      state.file_count = store.file_count || null
      if(store.skip >= 0) state.skip = store.skip + 1
      else state.skip = null

      var response = await web.getDocInfo(store.file['@rid'])
      state.file = response
      state.file.thumbnail = removeLastPathPart('/api/thumbnails/' + response.path)

      state.entities = await web.getEntities()

      image.src = state.file.thumbnail; 
      image.onload = () => {
        state.width = image.width;
        state.height = image.height;
        state.image_loaded = true
      };
    }

    function handleKeyDown(event) {
      if (event.ctrlKey) {
        state.isCtrlPressed = true;
      }
    }

    function handleKeyUp(event) {
      state.isCtrlPressed = false;
      if(event.key == 'ArrowLeft') prev()
      if(event.key == 'ArrowRight') next()
    }

    onMounted(async()=> {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      await load()

    })

   onUnmounted(() => {
      // Clean up event listeners when the component is destroyed
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
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
          if(apiUrl)
            return apiUrl + str.substring(0, lastIndex);
          else
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