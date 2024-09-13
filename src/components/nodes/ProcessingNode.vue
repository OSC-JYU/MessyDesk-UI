<style scoped>
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
import { Handle, Position } from '@vue-flow/core'


const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
})


</script>

<template>
  <div class="node-body nodrag text-white">
    
    <div class="d-flex align-center justify-center">
    
    <h3 class="p-2">{{  data.label }}</h3>
    
    
  </div>
  <pre class="p-2" v-if="data.description">{{ data.description }}</pre>
  
  <v-row align="center">
    <v-col cols="auto">
      <img src="icons/cookie-bite-solid-white.svg" />
    </v-col>
    <v-col>
      <p  v-if="data.info">
        
        <i>{{ data.info }}</i>
      </p>
    </v-col>
  </v-row>
  
  <Handle id="a" type="target" :position="Position.Left" />
  <Handle id="b" type="source" :position="Position.Right"  />

  </div>
  
  



</template>
