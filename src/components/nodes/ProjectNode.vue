<style scoped>

.node-body {
  min-height: 200px;
}

img {
  width:200px;

}
.header {
  background-color: #002957;
  color: white; 
  padding:3px
}
</style>


<script setup>
import { Handle, Position } from '@vue-flow/core'
//import { computed } from 'vue'
//import { colors } from '../presets.js'

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
})

</script>

<template>
  <div class="node-body">
    <div class="header">proj {{ data.label }}</div>
    <img :src="data.image" />
  {{ data.description }}
  </div>


</template>