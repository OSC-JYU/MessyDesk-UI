<style scoped>
img {
  max-width:280px;
  margin: 0px
}
.node-image {
  padding:0px;
  cursor: pointer;
}
.header {
  background-color: #54546f;
  color: white; 
  padding:3px
}
.crunch_add {
  color: #156a8b;
  position: absolute;
  height: 50px;
  top: -40px;
  right: -40px;
  cursor: pointer;

}
.crunch_add:hover {
  color: #189743;

}
.roi_add {
  position: relative;
  padding-left: 5px;
  color: white;
  top: 0px;
  right: 0px;
  background-color: #54546f;
}

.roi_crunch:hover {
  color: white;
  cursor: pointer;
  background-color: #49b369;
}

.image_display {

  max-height: 250px;}

</style>


<script setup>
import { Handle, Position, useNode } from '@vue-flow/core'
import { useRouter, useRoute } from 'vue-router'
import {store} from "../Store.js";
const apiUrl = import.meta.env.VITE_API_PATH

import CookieIcon from '@/assets/images/cookie-bite-solid_blue.svg';

const router = useRouter();
const route = useRoute();

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
})

 const { node } = useNode()


function openCrunchers(filter) {
  store.current_node = node
  store.crunchers_open = true
  store.cruncher_filter = filter
}


</script>

<template>
  <div class="node-image nodrag">
    
    <div class="header">{{ data.label }} 
      <img @click="openCrunchers('')" title="Add cruncher" class ="crunch_add" :src="CookieIcon" /> 
    </div>
    
    <v-container style="max-height: 360px; padding: 0px; overflow: hidden; position: relative;">
      <v-row>
        <v-col class="d-flex align-center justify-center">
          <img :src="data.image" draggable="false" style="width: 100%; height: auto;" />
        </v-col>
      </v-row>
      
      <v-row 
        v-if="data.description" 
        class="description-overlay m-0">
        <v-col class="d-flex justify-center">
          <pre style="margin: 0; overflow-wrap: break-word;">{{ data.description }}</pre>
        </v-col>
      </v-row>
    </v-container>


    <div v-if="data?.metadata"  class="roi_add"  >
      {{ data.metadata.width }}x{{ data.metadata.height }} ({{ data.metadata.size }} MB)
      <template v-if="data.roi_count">
        <v-icon size="35" >mdi-selection</v-icon> {{ data.roi_count? data.roi_count : 0 }}
        <v-icon title="Add region cruncher" @click="openCrunchers('ROI')" class="roi_crunch" size="35" >mdi-cookie</v-icon>
      </template>
    </div>


    <Handle id="a" type="target" :position="Position.Left" />

    <Handle id="b" type="source" :position="Position.Right" /> 
  </div>

</template>