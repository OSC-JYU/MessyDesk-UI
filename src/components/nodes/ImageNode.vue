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
  color: #156a8b;
  position: absolute;
  height: 50px;
  top: -40px;
  right: -40px;
  cursor: pointer;

}
.crunch_add:hover {
  color: #189743;

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
  <div class="node-image nodrag">
    
    <div class="header">{{ data.label }} 
      <img @click="openCrunchers(node.id)" title="Add cruncher" class ="crunch_add" src="icons/cookie-bite-solid_blue.svg" /> 
      
    </div>

    <v-container class="ma-2">
      <v-row>
        <v-col class="d-flex align-center justify-center">
          <img :src="data.image" />

        </v-col>
        <v-row>
          <v-col class="d-flex align-center justify-center">
           
            <pre v-if="data.description != data.label"> {{ data.description }}</pre>
            
          </v-col>

        </v-row>
      </v-row>


    </v-container>




    <Handle id="a" type="target" :position="Position.Left" />

    <Handle id="b" type="source" :position="Position.Right" /> 
  </div>

</template>