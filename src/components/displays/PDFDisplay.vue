<template>
    <v-container>
      <v-row>
        <v-btn @click="$router.go(-1)"><v-icon>mdi-arrow-left</v-icon></v-btn>
      </v-row>
      <v-row class="mt-6">
        <div v-if="state.file"><h2>{{ state.file.label }}</h2></div>
      </v-row>
      <v-row class="h-100">

        <v-col cols="9" fill-height>
         
          <iframe :src="state.rid" width="100%" height="100%"></iframe>
        </v-col>

        <v-col cols="3">
          <template v-if="state.cruncher">
            <v-card>
                <v-card-title>{{ state.cruncher.label }}</v-card-title>
                <v-card-text>{{ state.cruncher.info }}</v-card-text>
            </v-card>
          </template>
        </v-col>  

      </v-row>
    </v-container>

    
  </template>
  
  <script setup>

    import { onMounted, watch, reactive, ref, computed } from "vue";
    import { useRouter, useRoute } from 'vue-router'
    import VuePdfEmbed from 'vue-pdf-embed'
    
  
    import web from "../../web.js";


    const route = useRoute();

    var state = reactive({
        file: null,
        cruncher: null,
        rid: null
    })

    function replaceWithBr(text) {
      return text.replace(/\n/g, "<br />")
    }


    onMounted(async()=> {

        var response = await web.getDocInfo(route.params.rid)
        var f = await web.getNodeFile(route.params.rid)
        
        state.file = response
        state.rid = "/api/files/" + route.params.rid
        if(route.query.cruncher) {
          var response2 = await web.getDocInfo(route.query.cruncher)
          state.cruncher = response2
        }

    })

    function removeLastPathPart(str) {
        const lastIndex = str.lastIndexOf('/');
        if (lastIndex !== -1) {
            return str.substring(0, lastIndex);
        }
        return str;
    }

  </script>
  
  <style scoped>
  .container {
    display: flex;
  }
  
  .column {
    flex: 1;
  }
  
  .column img {
    max-width: 100%;
    height: auto;
  }
  </style>