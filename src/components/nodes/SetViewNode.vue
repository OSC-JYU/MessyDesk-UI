<style scoped>
img {
  max-width:280px;
  margin: 0px
}
.node-image {
  padding:0px;

}
.header {
  background-color: #54546f;
  color: white; 
  padding:3px
}


.image_display {

  max-height: 250px;}

.v-chip {
  margin-top: 6px;
  margin-left:10px;
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

const emit = defineEmits(['expand-node'])

</script>


<template>
  <div class="node-image nodrag cursor-pointer" >
    
    <div class="header">{{ data.label }}  </div>
    
    
    <v-container style="max-height: 360px; padding: 0px; overflow: hidden; position: relative;">

      <v-row >
        <v-chip v-if="store.settings_show_entities" v-for="entity of data.entities" :key="entity.id"  :color="entity.color" ><v-icon v-if="entity.icon" :icon="'mdi-' + entity.icon.toLowerCase()" start></v-icon> {{ entity.label }}</v-chip>
      </v-row>

      <v-switch class="mt-2" v-model="data.expand" @change="emit('expand-node', data)" label="Show in Desk" color="primary">expand</v-switch>
      <v-row>
        <v-col class="d-flex align-center justify-center">
          <img :src="data.thumb + '/thumbnail.jpg'" draggable="false" style="width: 100%; height: auto;" />
        </v-col>
      </v-row>


      <v-row 
        v-if="data.description" 
        class="description-overlay m-0">
        <v-col class="d-flex justify-center">
          <pre style="margin: 0; overflow-wrap: break-word;">{{ data.description }}</pre>
        </v-col>
      </v-row>

    </v-container>

  </div>

</template>