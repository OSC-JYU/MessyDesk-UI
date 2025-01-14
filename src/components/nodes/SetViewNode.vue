<style scoped>
img {
  max-width:280px;
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


.image_display {

  max-height: 250px;}

.v-chip {
  margin: 2px;
}
</style>


<script setup>
import {store} from "../Store.js";

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
})


</script>


<template>
  <div class="node-image nodrag cursor-pointer" >
    
    <div class="header">{{ data.label }}  </div>
    
    
    <v-container style="max-height: 360px; padding: 0px; overflow: hidden; position: relative;">
      <v-row >
        <v-chip v-if="store.settings_show_entities" v-for="entity of data.entities" :key="entity.id"  :color="entity.color" ><v-icon v-if="entity.icon" :icon="'mdi-' + entity.icon.toLowerCase()" start></v-icon> {{ entity.label }}</v-chip>
      </v-row>
      <v-row>
        <v-col class="d-flex align-center justify-center">
          <img :src="data.thumb + '/thumbnail.jpg'" draggable="false" style="width: 100%; height: auto;" />
        </v-col>
      </v-row>
      <!-- <v-switch v-model="file.expand" @change="expandSetNode(file)" label="Show in Desk" color="primary">expand</v-switch> -->


      <v-row 
        v-if="data.description != data.label" 
        class="description-overlay m-0"
        style="position: absolute; bottom: 0; width: 100%; background: rgba(0, 0, 0, 0.6); color: white; padding: 10px;">

        <v-col v-if="store.settings_show_descriptions" class="d-flex justify-center">
          <pre style="margin: 0; overflow-wrap: break-word;">{{ data.description }}</pre>
        </v-col>
      </v-row>

    </v-container>

  </div>

</template>