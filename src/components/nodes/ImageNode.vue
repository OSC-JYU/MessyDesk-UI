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
  //router.push({ name: 'crunchers', query: { node: node.id.replace('#', ''), desk:route.query.node} })
}

</script>

<template>
  <div class="node-image">
    
    <div class="header">{{ data.label }} 
      <!-- <img @click="openCrunchers(node.id)" title="Add cruncher" class ="crunch_add" src="icons/cookie-bite-solid_blue.svg" /> -->
      <v-icon @click="openCrunchers(node.id)" title="Add cruncher" class ="crunch_add" size="65" >mdi-cookie-plus</v-icon>
    </div>

    <v-container >
      <v-row>
        <v-col>
          <img :src="data.image" />

        </v-col>
        <v-row>
          <v-col>
            <h3>{{ data.label }}</h3>
          </v-col>

        </v-row>
      </v-row>


    </v-container>




    <Handle id="a" type="target" :position="Position.Left" />

    <Handle id="b" type="source" :position="Position.Right" /> 
  </div>

</template>