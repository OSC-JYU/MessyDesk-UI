<style scoped>

.vue-flow__node {
  min-width: 300px;
}

.node-body {
  min-height: 200px;
  min-width: 300px;
  cursor: pointer;
}

img {
  width:100px;

}
.header {
  background-color: #005757;
  color: white; 
  padding:3px;
  text-align: left !important;
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

.image-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.image-item {
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-item img {
  max-width: 100%;
  height: auto;
  object-fit: cover;
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
      <v-icon v-if ="data.status == 'running'" size="35" color="orange">mdi-run</v-icon>
      <v-icon v-else size="35" color="green">mdi-folder-outline</v-icon>
       {{ data.label }}
       <span v-if="data.count">  ({{ data.count }} files)</span><span v-else>(empty)</span> </div>
    <v-icon v-if="data?.count > 0 && data.status != 'running'" @click="openCrunchers('')" title="Add cruncher" class ="crunch_add" size="65" >mdi-cookie-plus</v-icon>
    <v-container>
     

      <v-row>
        <v-col>
          <div v-if="data.paths && data.paths.length > 0" class="image-grid">
            <div v-for="(f, index) in data.paths" :key="index" class="image-item">
              <img :src="f" class="w-200 shadow-1-strong rounded mb-2" draggable="false"/>
            </div>
          </div>

          <div v-if="!data.paths && data.count > 0" class="pa-10">
            <v-icon size="55" >mdi-text-box-multiple-outline</v-icon>
          </div>
        </v-col>
      </v-row>
      <v-col>
       
          <!-- <div style="white-space: pre;" v-if="data.description">{{ data.description }}</div> -->
          <pre v-if="data.description">{{ data.description }}</pre>
        
          
        </v-col>
    </v-container>



    <Handle id="a" type="target" :position="Position.Left" />
    <Handle id="b" type="source" :position="Position.Right" /> 
  </div>


</template>