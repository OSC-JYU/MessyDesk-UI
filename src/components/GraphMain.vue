
<style>

.v-tabs-window {
  height: 100%;
}

.v-window-item {
  height: 100%;
}

.full-background {
    background-image:  linear-gradient(rgba(19,84,122,.8), rgba(128,208,199,.8)),url('../assets/images/right-column-bg2.png');
    background-size: cover; /* Ensures the image covers the entire div */
    background-repeat: no-repeat; /* Prevents the image from repeating */
    background-position: center; /* Centers the image within the div */
    width: 100%; /* Optional: make the div take up the full width of its container */
    height: 100%; /* Optional: make the div take up the full height of its container */

}

</style>

<script setup>
    import { reactive, watch } from "vue";
    import { useRoute } from 'vue-router'
    import web from "../web.js";
    import {store} from "./Store.js";
    import GraphDisplay from './GraphDisplay.vue'
    import NodeDeleter from './NodeDeleter.vue'
    import Uploader from './Uploader.vue'
    import NodeCard from './NodeCard.vue'
    import JYUHeader from './JYUHeader.vue'
    import CruncherList from './CruncherList.vue'

    import SetCreator from './SetCreator.vue'

    import SearchMain from './SearchMain.vue'
    import EntitiesMain from './EntitiesMain.vue'

    import ImageDisplay from './displays/ImageDisplay.vue'
    import OSDDisplay from './displays/OSDDisplay.vue'
    import HOCRDisplay from './displays/HOCRDisplay.vue'
    import NER_Display from './displays/NER_Display.vue'
    import TextDisplay from './displays/TextDisplay.vue'
    import PDFDisplay from './displays/PDFDisplay.vue'
    import HumanJSONDisplay from './displays/HumanJSONDisplay.vue'

    document.title = "MessyDesk"

    const route  = useRoute();

    var state = reactive({node:'', tab: 0})

    function fitToNode(id) {
        state.node = id + '-' + Math.random()
    }

    function changeTab(tab) {
      console.log(tab)
      state.tab = tab
      store.tab = tab
    }

    async function openNode(node_rid, source_rid) {
      var response = await web.getDocInfo(node_rid)
      store.file = response
      store.source = source_rid
      state.tab = 3
    }


</script>


<template>
    
    <v-layout class="fill-height">

        <JYUHeader mode="graph" @fit-to-node="fitToNode" @change-tab="changeTab"/>
        <v-main class="fill-height">

        
          <v-tabs-window v-model="state.tab" class="w-100 h-100 fill-height">

            <v-tabs-window-item class="w-100 fill-height"  >
              <v-row class="w-100 fill-height"> 

                <v-col
                class="pb-0 fill-height "
                cols="9"
                color="light-blue lighten-3"
              >
                    <!-- Second column content -->
                    <GraphDisplay mode="graph"  :fit="state.node" @open-node="openNode" />
                    <Uploader mode="graph" />
                    <NodeDeleter mode="graph" />
                    <SetCreator mode="graph" /> 
                </v-col>


                <v-col  lass="pa-0 full-background"
                  cols="3"
                  color="light-blue lighten-1">
                  <NodeCard class="h-100 w-100 position-absolute" />
                </v-col>
              </v-row>
            </v-tabs-window-item> 


            <v-tabs-window-item>
              <SearchMain />
            </v-tabs-window-item>

            <v-tabs-window-item>
              <EntitiesMain/>
            </v-tabs-window-item>

            <v-tabs-window-item>
              <v-container class="fill-height pa-0" fluid>
                <v-row class="fill-height no-gutters" >

            
                  <v-col
                    class="d-flex fill-height overflow-aut"
                    cols="12"
                    color="light-blue lighten-3"
                  >
                    <!-- Second column content -->
                    <ImageDisplay v-if="store.file  && store.file.type=='image'" @change-tab="changeTab" :tab="state.tab"/>
                    <TextDisplay v-if="store.file  && store.file.type=='text' && store.file.extension=='txt'" @change-tab="changeTab" :tab="state.tab"/> 
                    <OSDDisplay v-if="store.file  && store.file.type=='osd.json'" @change-tab="changeTab" :tab="state.tab"/> 
                    <HumanJSONDisplay v-if="store.file  && store.file.type=='human.json'" @change-tab="changeTab" :tab="state.tab"/>
                    <PDFDisplay v-if="store.file  && store.file.type=='pdf'" @change-tab="changeTab" :tab="state.tab"/>
                    <HOCRDisplay v-if="store.file && store.file.extension=='hocr'" @change-tab="changeTab" :tab="state.tab"/>
                    <NER_Display v-if="store.file && store.file.type=='ner.json'" @change-tab="changeTab"  :tab="state.tab"/>
                  </v-col>

                </v-row>
              </v-container>
 


            </v-tabs-window-item>

            </v-tabs-window>

          <!-- CRUNCHERS dialog-->
            <v-dialog v-model="store.crunchers_open" width="auto" min-width="900">

              <v-card>
                  <v-toolbar>
                  <v-btn
                      icon="mdi-close"
                      @click="store.crunchers_open = false"
                  ></v-btn>
                  <v-toolbar-title>Available crunchers for {{ store.current_node.type }} {{ store.cruncher_filter }}</v-toolbar-title>


                  <v-spacer></v-spacer>


                  </v-toolbar>

                  <CruncherList />
              </v-card>

              </v-dialog>

        </v-main>
    </v-layout>
</template>
  