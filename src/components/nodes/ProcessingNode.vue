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
    
    <div class="d-flex align-center justify-center">
    
    <h3 class="p-2">{{  data.label }}</h3>
    
    
  </div>
  <pre class="p-2" v-if="data.description">{{ data.description }}</pre>

  <v-alert icon="mdi-karate" type="error" v-if="data.error"> {{ data.error }}</v-alert>
  
  
  
  
  <v-row align="center">
    <v-col cols="auto">
      <img v-if="data.image" :src="data.image" />  
      <img v-else-if="!data.error" :src="CookieIconWhite"/>
      <!-- <img src="icons/wait.gif" /> -->
    </v-col>
    <v-col>
      <p  v-if="data.info && !data.error">
        <i>{{ data.info }}</i>
      </p>
      <v-chip class="mb-2" v-if="data.service" color="orange" variant="flat">
      {{ data.service }}
    </v-chip>
    </v-col>
  </v-row>

  <Handle id="a" type="target" :position="Position.Left" />
  <Handle id="b" type="source" :position="Position.Right"  />

  </div>
  
  



</template>
