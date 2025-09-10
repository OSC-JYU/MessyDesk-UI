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
import CookieIconWhite from '@/assets/images/cookie-bite-solid-white.svg';


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

    <v-alert icon="mdi-karate" type="error" v-if="data.error">errors: {{ data.error_count }}</v-alert>
  
 
  
  <v-row align="center">
    <v-col cols="auto">
      <img v-if="!data.error" :src="CookieIconWhite"/>
    </v-col>
    <v-col>
      <p class="p-2" v-if="data.info">
        <i>{{ data.info }}</i>
      </p>
      
      <i>{{ data.duration }}</i>
      <v-chip class="mb-2" v-if="data.service" color="orange" variant="flat">
      {{ data.service }} 
    </v-chip>
    </v-col>
  </v-row>

  <Handle id="a" type="target" :position="Position.Left" />

  <Handle id="b" type="source" :position="Position.Right"  />

  </div>

</template>
