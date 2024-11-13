<style scoped>
em {
  font-style: normal;
  font-weight: bold;
  color: red important;  }

  .column_text2 {
  height: 100%;
  overflow-y: scroll;
}

</style>

<script setup>
    import JYUHeader from './JYUHeader.vue'
    import web from "../web.js";
    
    import { onMounted, reactive} from "vue";
    import { useRoute } from 'vue-router'

    const route = useRoute();

    document.title = "MessyDesk - entities"


    var state = reactive({
        search: "",
        result: [],
        text: " <div style=\"color:red;\" role=\"alert\">The search is not fully functional yet.</div> <h2>How search works?</h2><p>When your crunchers create texts (like OCR) or Region of interests (like NER), or when you write description, the text get indexed and you can find it with search.</p>By default, the search is very aggressive, so it should work well with OCR texts also.<br> <br><br>If you have any ideas of how search should work, then contact ari.hayrinen@jyu.fi "
    })

    async function search() {
        state.result = await web.search(state.search)
    }

    async function go(rid) {
      var response = await web.getDocInfo(rid)
      var f = await web.getNodeFile(rid)
        
      state.file = response
      state.text = replaceWithBr(f)
    }

    function replaceWithBr(text) {
      return text.replace(/\n/g, "<br />")
    }

    onMounted(async()=> {

    })



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
            <v-container>
              <v-row>
                <v-btn @click="$router.go(-1)"><v-icon>mdi-arrow-left</v-icon></v-btn>
              </v-row>
              <v-row class="mt-6">
                <div v-if="state.file"><h2><router-link :to="'/files/' + state.file['@rid'].replace('#','')">{{ state.file.label }}</router-link></h2></div>
              </v-row>
              <v-row class="column_text">

                <v-col cols="8" class="column_text2 paper">
                  
                  <div ref="textContainer" v-html="state.text"></div>
                </v-col>

                <v-col
                class="d-flex fill-height overflow-y-auto"
                cols="4"
                color="light-blue lighten-3"
              >
                <!-- Second column content -->
                 <v-container>
                  <h2>Search 3</h2>
                  <v-text-field v-model="state.search" @keydown.enter="search()" label="Search"></v-text-field>
                  <v-btn @click="search()">Search</v-btn>

                  <v-select
                    label="Select"
                    :items="[{title:'All', value:'all'}, {title:'Texts', value:'text'}]"
                  ></v-select>

                  
                  <template v-if="state.result.response">
                    <!-- {{ state.result.response.docs}} -->
                  <v-card @click="go(item.id)" v-for="item in state.result.response.docs" :key="item" class="mt-2">
                    <v-card-title >
                      <div >{{item.id}}  ({{item.type}}) {{item.label}} </div>
                    </v-card-title>
                    <v-card-subtitle v-if="item.description">{{ item.description.replace('\n', '') }}</v-card-subtitle> 
                    <v-card-text v-if="state.result.highlighting[item.id]" v-html="state.result.highlighting[item.id].fulltext"></v-card-text>
                  </v-card>

                  </template>
                  </v-container>
                </v-col>

              </v-row>
            </v-container>
            </v-col>

          </v-row>
        </v-container>
      </v-main>
    </v-layout>
  </v-card>
</template>


