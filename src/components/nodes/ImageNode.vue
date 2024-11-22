<style scoped>
img {
  max-width:280px;
  margin: 0px
}
.node-image {
  padding:0px
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
    
    <v-container   style="max-height: 360px; padding: 0px; overflow: hidden;">
      <v-row>
        <v-col class="d-flex align-center justify-center ">

          <img :src="data.image" draggable="false"/>
          
        </v-col>
      </v-row>

      <v-row v-if="data.description != data.label">
        <v-col class="d-flex align-center justify-center p-0">
          
          <pre>{{ data.description }}</pre>
          
        </v-col>
      </v-row>
      


    </v-container>

    <div v-if="data.roi_count" title="double click to add/edit regions" class="roi_add"  >
      <v-icon size="35" >mdi-selection</v-icon> {{ data.roi_count? data.roi_count : 0 }} Regions of Interest 
      <v-icon v-if="data.roi_count" title="Add region cruncher" @click="openCrunchers('ROI')" class="roi_crunch" size="35" >mdi-cookie</v-icon>
    </div>


    <Handle id="a" type="target" :position="Position.Left" />

    <Handle id="b" type="source" :position="Position.Right" /> 
  </div>

</template>