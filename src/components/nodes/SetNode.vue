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
    <div class="header"><v-icon size="35" color="green">mdi-folder-outline</v-icon> IMAGE SET <span v-if="data.count">  ({{ data.count }} images)</span><span v-else>(empty)</span> </div>
    <v-icon @click="openCrunchers('')" title="Add cruncher" class ="crunch_add" size="65" >mdi-cookie-plus</v-icon>
    <v-container>
     

      <v-row>
        <v-col>
          <div class="col-lg-4 col-md-12 mb-4 mb-lg-0">
            <img v-for="f in data.paths" :src="f" class="w-200 shadow-1-strong rounded mb-4" draggable="false"/>
          </div>
        </v-col>

        <v-col>
          <h3>{{ data.label }}</h3>
          <!-- <div style="white-space: pre;" v-if="data.description">{{ data.description }}</div> -->
          <pre v-if="data.description">{{ data.description }}</pre>
          <div v-else>{{ data.file_count }}</div>
          
        </v-col>
      </v-row>

    </v-container>



    <Handle id="a" type="target" :position="Position.Left" />
    <Handle id="b" type="source" :position="Position.Right" /> 
  </div>


</template>