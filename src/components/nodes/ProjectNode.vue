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
  <div class="node-body">
    <div class="header"> Desk ({{ data.file_count }})</div>
    <v-container>
      <v-row>
        <v-col>
          <div class="col-lg-4 col-md-12 mb-4 mb-lg-0">
            <img v-for="f in data.paths" :src="f" class="w-200 shadow-1-strong rounded mb-4" draggable="false"/>
          </div>
        </v-col>

        <v-col>
          <h3>{{ data.label }}</h3>
          <!-- <div style="white-space: pre;" v-if="data.description">{{ data.description }}</div> -->
          <pre v-if="data.description">{{ data.description }}</pre>
          <div v-else>{{ data.file_count }}</div>
          
        </v-col>

      </v-row>

    </v-container>

  
  </div>


</template>