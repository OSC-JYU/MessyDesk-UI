<style scoped>

.node-body {
  min-height: 200px;
  min-width: 300px;
}

img {
  width:160px;

}
.header {
  background-color: #9d4f4f;
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

<v-card
  >
    <v-img
      src="https://cdn.vuetifyjs.com/images/cards/sunshine.jpg"
      height="230px"
    ></v-img>

    <v-card-title>
      {{ data.label }}
    </v-card-title>

    <v-card-subtitle class="text-wrap">
      "If a cluttered desk is a sign of a cluttered mind, of what, then, is an empty desk a sign?"
    </v-card-subtitle>
    <br>




  </v-card>


  


</template>