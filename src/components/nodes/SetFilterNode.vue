<style scoped>

.vue-flow__node {
  min-width: 200px;
}

.node-body {
  min-height: 100px;
  min-width: 200px;
  cursor: pointer;
  background-color: #484f68;
}

img {
  width:100px;

}
.header {

  color: white; 
  padding:3px;
  text-align: left !important;
  border-bottom: #156a8b 1px solid;
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



</style>


<script setup>
import { Handle, Position, useNode } from '@vue-flow/core'
import {store} from "../Store.js";

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
  <div class="node-body nodrag">
    <div class="header">

       {{ data.label }}
        </div>
    <v-icon  @click="openCrunchers('')" title="Add cruncher" class ="crunch_add" size="65" >mdi-cookie-plus</v-icon>
    <v-container class="filter-body">
     

      <v-row>
        <v-col class="d-flex justify-center align-center">
        
          <v-icon size="85" color="white">mdi-hand-wave</v-icon>
          <v-icon size="85" color="white">mdi-shape-rectangle-plus</v-icon>
          
        </v-col>
      </v-row>
      <v-col>
       
          <!-- <div style="white-space: pre;" v-if="data.description">{{ data.description }}</div> -->
          <pre class="text-white" v-if="data.description">{{ data.description }}</pre>
        
          
        </v-col>
    </v-container>



    <Handle id="a" type="target" :position="Position.Left" />
    <Handle id="b" type="source" :position="Position.Right" /> 
  </div>


</template>