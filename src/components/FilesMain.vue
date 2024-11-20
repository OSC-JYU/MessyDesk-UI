<script setup>
    import JYUHeader from './JYUHeader.vue'
    import ImageDisplay from './displays/ImageDisplay.vue'
    import OSDDisplay from './displays/OSDDisplay.vue'
    import HOCRDisplay from './displays/HOCRDisplay.vue'
    import NER_Display from './displays/NER_Display.vue'
    import TextDisplay from './displays/TextDisplay.vue'
    import PDFDisplay from './displays/PDFDisplay.vue'
    import HumanJSONDisplay from './displays/HumanJSONDisplay.vue'
    import web from "../web.js";
    
    import { onMounted, watch, reactive, ref, computed } from "vue";
    import { useRouter, useRoute } from 'vue-router'

    const route = useRoute();

    document.title = "MessyDesk - files"


    var state = reactive({
        file: null
    })

    onMounted(async()=> {

        var response = await web.getDocInfo(route.params.rid)
        
        state.file = response
        console.log(state.file)
        state.file.thumbnail = removeLastPathPart(response.path.replace('data/', '/api/thumbnails/'))
        document.title = state.file.label
    })

    function removeLastPathPart(str) {
        const lastIndex = str.lastIndexOf('/');
        if (lastIndex !== -1) {
            return str.substring(0, lastIndex);
        }
        return str;
    }


</script>



<template>
    <v-card class="mx-auto fill-height" color="grey-lighten-3" flat>
      <v-layout class="fill-height">

        <JYUHeader/>
  
        <v-main class="fill-height">
          <v-container class="fill-height pa-0" fluid>
            <v-row class="fill-height no-gutters" >

           

              <v-col
                class="d-flex fill-height overflow-aut"
                cols="12"
                color="light-blue lighten-3"
              >
                <!-- Second column content -->
                <ImageDisplay v-if="state.file  && state.file.type=='image'"/>
                <TextDisplay v-if="state.file  && state.file.type=='text' && state.file.extension=='txt'"/> 
                <OSDDisplay v-if="state.file  && state.file.type=='osd.json'"/> 
                <HumanJSONDisplay v-if="state.file  && state.file.type=='human.json'"/>
                <PDFDisplay v-if="state.file  && state.file.type=='pdf'"/>
                <HOCRDisplay v-if="state.file && state.file.extension=='hocr'"/>
                <NER_Display v-if="state.file && state.file.extension=='json' && state.file.label.includes('.ner.json')"/>
              </v-col>

            </v-row>
          </v-container>
        </v-main>
      </v-layout>
    </v-card>
  </template>


