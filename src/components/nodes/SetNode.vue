<style scoped>

.node-body {
  min-height: 200px;
  min-width: 200px;
}

img {
  width:200px;

}
.header {
  background-color: #005757;
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
  <div class="node-body">
    <div class="header"> {{ data.label }}</div>
   
    {{ data.description }}
    <Handle id="a" type="target" :position="Position.Left" />
    <Handle id="b" type="source" :position="Position.Right" /> 
  </div>


</template>