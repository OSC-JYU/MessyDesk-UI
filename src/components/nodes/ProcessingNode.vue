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
  <div class="header"> {{ data.label }}</div>
  <img src="icons/cookie-bite-solid.svg" />




  <Handle id="a" type="target" :position="Position.Left" />

  <Handle id="b" type="source" :position="Position.Right"  />
</template>
