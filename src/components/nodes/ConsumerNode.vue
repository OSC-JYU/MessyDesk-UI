<style scoped>
img {
  width:60px;
}

.header {
  background-color: #1a9f23;
  color: white; 
  padding:3px;
  border-radius: 10px 10px / 20px;
  border:none;
  padding-left:7px;
  padding-right:7px;
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


  <Handle id="a" type="target" :position="Position.Left" />

  <Handle id="b" type="source" :position="Position.Right"  />
</template>
