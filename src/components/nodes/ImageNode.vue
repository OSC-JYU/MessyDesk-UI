<style scoped>
img {
  max-width:200px;
  margin: 0px
}
.node-image .header {
  background-color: #54546f;
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
  <div class="node-image">
    <div class="header">{{ data.label }}</div>
    <img :src="data.image" />
    {{ data.description }}

    <Handle id="a" type="target" :position="Position.Left" />

    <Handle id="b" type="source" :position="Position.Right" /> 
  </div>

</template>