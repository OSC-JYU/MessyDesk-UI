<style scoped>
img {
  max-width:200px;
  margin: 0px
}
.node-image {
  padding:0px
}
.header {
  background-color: #54546f;
  color: white; 
  padding:3px
}
.crunch_add {
  color: #458b55;
  position: absolute;
  height: 50px;
  top: -40px;
  right: -40px;
  cursor: pointer;

}
.crunch_add:hover {
  fill: #099f18;
  line-height: red;
  size: 120%;
  background-color: white;
}
</style>


<script setup>
import { Handle, Position, useNode } from '@vue-flow/core'
import { useRouter, useRoute } from 'vue-router'
import {store} from "../Store.js";

const router = useRouter();
const route = useRoute();

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
})

 const { node } = useNode()


function openCrunchers(id) {
  store.current_node = node
  store.crunchers_open = true
}

</script>

<template>
  <div class="node-image">
    
    <div class="header">{{ data.label }} 
      
      <img @click="openCrunchers(node.id)" title="Add cruncher" class ="crunch_add" :src="CookieIcon" />
    </div>
    <div class="m-2">
      <v-icon size="45" color="green">mdi-code-json</v-icon> json
      <v-icon size="65" color="green">mdi-face-man</v-icon>
      <v-chip v-if="data.model" color="green" variant="outlined">
        {{ data.model }}
      </v-chip>
    </div>



    <Handle id="a" type="target" :position="Position.Left" />

    <Handle id="b" type="source" :position="Position.Right" /> 
  </div>

</template>