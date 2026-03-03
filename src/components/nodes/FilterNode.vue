<style scoped>
.node-body {
  cursor: default;
}
img {
  width:60px;
}

.header {
  background-color: #4c825f;
  color: white; 
  padding:3px
}
</style>


<script setup>
import { Handle, Position, useNode } from '@vue-flow/core'
import CookieIconWhite from '@/assets/images/cookie-bite-solid-white.svg';
import WaitIcon from '@/assets/images/wait.gif';
import { store } from "../Store.js";

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
})

const { node } = useNode()

function openFilters() {
  store.current_node = node
  store.filter_editor = node
}
</script>

<template>
  <div class="nodrag text-white">
    
    <div class="d-flex align-center justify-center">
      <h4 class="p-2">Regions</h4>
    </div>
    <pre class="p-2" v-if="data.description">{{ data.description }}</pre>
  
  <v-row align="center">
    <v-col cols="auto">

 
    </v-col>
    <v-col >
      <p  >
        <i>{{ data.info }}</i>
        
      
      </p>
      <i>{{ data.time }}</i>
      <v-chip class="mb-2" v-if="data.service" color="blue" variant="flat">
      {{ data.service }} 
    </v-chip>

    </v-col>
  </v-row>

  <Handle id="a" type="target" :position="Position.Left" />
  <Handle id="b" type="source" :position="Position.Right"  />

  </div>
  
  



</template>
