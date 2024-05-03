<style scoped>
.node-pdf {
  min-height: 200px;
}

img {
  max-width:200px;
  margin: 0px
}
.node-pdf .header {
  background-color: #9b4949;
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
  <div class="node-pdf">
    <div class="header">{{ data.label }}</div>
    <img :src="data.image" />
    {{ data.description }}

    <Handle id="a" type="target" :position="Position.Left" />

    <Handle id="b" type="source" :position="Position.Right" /> 
  </div>

</template>