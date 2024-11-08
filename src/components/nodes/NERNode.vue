<style scoped>
img {
  max-width:200px;
  margin: 0px
}
.node-image {
  padding:0px
}
.header {
  background-color: #ac9620;;
  color: white; 
  padding:3px;
  padding-left:10px;
  padding-right:10px
}
.crunch_add {
  color: #458b55;
  position: absolute;
  height: 50px;
  top: -40px;
  right: -40px;
  cursor: pointer;

}
.crunch_add:hover {
  fill: #099f18;
  line-height: red;
  size: 120%;
  background-color: white;
}
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


function openCrunchers(id) {
  store.current_node = node
  store.crunchers_open = true
}

</script>

<template>
  <div class="node-image nodrag">
    
    <div class="header"> Natural Entities 
      
      <img @click="openCrunchers(node.id)" title="Add cruncher" class ="crunch_add" src="icons/cookie-bite-solid_blue.svg" />
    </div>
    <div class="m-2">
      <v-icon size="45" color="green">mdi-map-marker</v-icon> 
      <v-icon size="65" color="green">mdi-face-man</v-icon>
      <v-chip v-if="data.model" color="green" variant="outlined">
        {{ data.model }}
      </v-chip>
      <v-row>
        <v-col class="d-flex align-center justify-center">
          
          <pre v-if="data.description != data.label"> {{ data.description }}</pre>
          
        </v-col>
        
        
      </v-row>
    </div>



    <Handle id="a" type="target" :position="Position.Left" />

    <Handle id="b" type="source" :position="Position.Right" /> 
  </div>

</template>