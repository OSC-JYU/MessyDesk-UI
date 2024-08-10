
<script setup>
    import { onMounted, watch, reactive, ref, computed } from "vue";
    import { useRouter, useRoute } from 'vue-router'
 	import JYUHeader from './JYUHeader.vue'
 	import CruncherList from './CruncherList.vue'
	import NodeCard from './NodeCard.vue'
    import ProcessCreator from './ProcessCreator.vue'

	document.title = "Crunchers aka processing tools"

    const route  = useRoute();
    const router = useRouter();

  

</script>

<template>
    <v-card class="mx-auto fill-height" color="grey-lighten-3" flat>
      <v-layout class="fill-height">

        <JYUHeader/>
  
        <v-main class="fill-height">
          <v-container class="fill-height pa-0" fluid>
            <v-row class="fill-height no-gutters" >


              <v-col
                class="d-flex fill-height "
                cols="9"
                color="light-blue lighten-3"
              >
                <!-- Second column content -->
                <ProcessCreator />
                <CruncherList />
              </v-col>

              <v-col
                class="d-flex fill-height "
                cols="3"
                color="light-blue lighten-1"
              >
                <!-- Third column content -->
                <NodeCard class="h-100 w-100 position-absolute"/>
              </v-col>
            </v-row>
          </v-container>
        </v-main>
      </v-layout>
    </v-card>
  </template>


