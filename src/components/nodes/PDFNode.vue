<style scoped>
.node-pdf {
  min-height: 200px;
}

img {
  max-width:190px;
  margin: 0px
}
.node-pdf .header {
  background-color: #9b4949;
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
  router.push({ name: 'crunchers', query: { node: node.id.replace('#', ''), desk:route.query.node} })
}

</script>

<template>
  <div class="node-pdf">
    <div class="header">{{ data.label }}</div>
    <img @click="openCrunchers(node.id)" title="Add cruncher" class ="crunch_add" src="icons/cookie-bite-solid_blue.svg" />
    <div class="m-2">
      <img :src="data.image" />
      {{ data.description }}
      <v-chip v-if="data.model" color="green" variant="outlined">
        {{ data.model }}
      </v-chip>

    </div>

    <Handle id="a" type="target" :position="Position.Left" />
    <Handle id="r" type="target" :position="Position.Right" />

    <Handle id="b" type="source" :position="Position.Right" /> 
    <Handle id="t" type="source" :position="Position.Top" /> 
    <Handle id="l" type="source" :position="Position.Left" /> 
  </div>

</template>