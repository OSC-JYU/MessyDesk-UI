<style scoped>

.vue-flow__node {
  min-width: 300px;
}

.node-body {
  min-height: 200px;
  min-width: 300px;
  cursor: default;
}

img {
  width:100px;

}
.header {
  background-color: #b16a31;
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
.roi_add {
  position: relative;
  padding-left: 10px;
  color: white;
  top: 0px;
  right: 0px;
  background-color: #54546f;
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
    <div class="header"><v-icon size="35" color="orange">mdi-folder-outline</v-icon> ZIP </div>
    <v-icon @click="openCrunchers('')" title="Add cruncher" class ="crunch_add" size="65" >mdi-cookie-plus</v-icon>
    <v-container style="min-height: 160px; padding: 10px; overflow: hidden; position: relative;">


      <v-row>
        <v-col>
          <v-icon size="65">mdi-folder-zip-outline</v-icon>
        </v-col>

        <v-col>
          <h3>{{ data.label }}</h3>
          <!-- <div style="white-space: pre;" v-if="data.description">{{ data.description }}</div> -->
          <pre v-if="data.description">{{ data.description }}</pre>
          
          
        </v-col>
      </v-row>

    </v-container>

    <div v-if="data?.metadata"  class="roi_add"  >
      {{ data.metadata.size }} MB
    </div>

    <Handle id="a" type="target" :position="Position.Left" />
    <Handle id="b" type="source" :position="Position.Right" /> 
  </div>


</template>