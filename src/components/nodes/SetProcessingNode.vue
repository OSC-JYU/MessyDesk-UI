<style scoped>
img {
  width:60px;
}

.header {
  background-color: #34816a;
  color: white; 
  padding:3px;
  min-width:120px;
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
    <div class="header"><v-icon class="mr-2">mdi-folder</v-icon><v-icon class="mr-2">mdi-cookie</v-icon> {{ data.label }}</div>
  
    <div class="d-flex align-center justify-center">
      
      <h3 class="p-2">{{  data.label }}</h3>
      
    </div>
    
    <pre class="p-2" v-if="data.description">{{ data.description }}</pre>
  
  <p class="p-2" v-if="data.info"><i>{{ data.info }}</i></p>
  
  <v-row align="center">
    <v-col cols="auto">
      <img :src="CookieIcon" />
    </v-col>
    <v-col>
      <p class="p-2" v-if="data.info">
        <v-icon class="mr-2">mdi-information</v-icon>
        <i>{{ data.info }}</i>
      </p>
    </v-col>
  </v-row>

  <Handle id="a" type="target" :position="Position.Left" />

  <Handle id="b" type="source" :position="Position.Right"  />

  </div>

</template>
