<style scoped>

.vue-flow__node {
  min-width: 300px;
}

.node-body {
  min-height: 200px;
  min-width: 300px;
}

img {
  width:100px;

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
  <div class="node-body nodrag">
    <div class="header">IMAGE SET</div>
    <v-container>
      <h3>{{ data.label }}</h3>

      <v-row>
        <v-col>
          <v-icon size="65" color="green">mdi-folder-outline</v-icon><br>
          0 images 
        </v-col>

        <v-col>
          <div class="col-lg-4 col-md-12 mb-4 mb-lg-0">
            <img v-for="f in data.paths" :src="f" class="w-200 shadow-1-strong rounded mb-4"/>
          </div>
        </v-col>
      </v-row>
    </v-container>
    <div class="m-2">
      {{ data.description }} 
    </div>

    <div class="row m-4">
      <div class="col-lg-4 col-md-12 mb-4 mb-lg-0">
        <img v-for="f in data.paths" :src="f" class="shadow-1-strong rounded mb-4"/>
      </div>
    </div>

    <Handle id="a" type="target" :position="Position.Left" />
    <Handle id="b" type="source" :position="Position.Right" /> 
  </div>


</template>