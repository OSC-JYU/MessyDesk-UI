<style scoped>
em {
  font-style: normal;
  font-weight: bold;
  color: red important;  }

  .column_text2 {
  height: 100%;
  overflow-y: scroll;
}
.v-container {
  max-width:2000px
}

.column_text {
    height: 100%;
    
}

.paper {
  background-color: white;
}

.node-base {
  padding: 4px;
  margin-top:5px;
  border-radius: 0px;
  color:white;
  font-size: small;
}

.File {
  background-color: red;
}

.Process {
  background-color: #5b9b9a;
  border-radius: 5px;
  text-align: center;
  
}

.Project {
  background-color: white;
  color: black;
  border: solid #16147f;
  border-width: 10px 0 0 0;
  text-align: center;
}


.Set {
  background-color: #005757;
}

.User {
  background-color: #005757;
}

.text {
  background-color: white;
  color: black;
}

.image {
  background-color: #54546f;
}

.pdf {
  background-color: #9b4949;
  color: white;
}

.tiny {
  width: 100px;
}
</style>

<script setup>
    import web from "../web.js";
    
    import { onMounted, reactive} from "vue";

    document.title = "MessyDesk - search"



    var state = reactive({
        search: "",
        result: [],
        text: "",
        desks:[],
        projects: [],
        types: [],
        nodepath: []
    })

    async function search() {
        state.result = await web.search(state.search)
    }

    async function go(rid) {
      var response = await web.getDocInfo(rid)
      var f = await web.getNodeFile(rid)
        
      state.file = response
      state.text = replaceWithBr(f)
      var nodepath = await web.getNodePath(rid)
      state.nodepath = nodepath
    }

    function replaceWithBr(text) {
      return text.replace(/\n/g, "<br />")
    }

    onMounted(async()=> {
      var projects = await web.getProjects()
      state.projects = [{title: 'All', value: ''}]

      for(var project of projects) {
        state.projects.push({value: project['@rid'], title: project.label})       
      }

    })



</script>


<template>
  <v-card class="mx-auto fill-height" color="grey-lighten-3" flat>
    <v-layout class="fill-height">


      <v-main class="fill-height">
        <v-container class="fill-height pa-0" fluid>
          <v-row class="fill-height no-gutters" >

            <v-col
              class="d-flex fill-height overflow-auto"
              cols="12"
              color="light-blue lighten-3"
            >
            <v-container>

              <v-row class="column_text">
                <!-- LEFT COLUMN -->
                <v-col cols="1" align="center">
                  <template v-for="node of state.nodepath">
                    <div v-if="node['@type'] !== 'User'"><v-icon size="15" color="green">mdi-arrow-up</v-icon></div>
                    <div v-if="node['@type'] !== 'User'" :class="'node-base ' + node['@type']+' '+node.type"  >{{ node.label }}
                      <img class="tiny" v-if="node.type == 'pdf' || node.type == 'image'" :src="'api/thumbnails/' + node.path" />
                    </div>
                  </template>
                </v-col>

                <!-- MIDDLE COLUMN -->
                <v-col cols="7" :class="state.text ? 'column_text2 paper' : ''">
                  
                 

                  <!-- <div v-if="state.file"><h5><router-link :to="'/files/' + state.file['@rid'].replace('#','')">{{ state.file.label }}</router-link></h5></div> -->
                  
                  <!-- ITEM DISPLAY -->
                  <div >
                    <div v-if="state.text" ref="textContainer" v-html="state.text"></div>
                    <v-card v-else color="#EDE1CE" class="p-2"> <h4>How search works?</h4><p>When your crunchers create texts (like OCR) or Region of interests (like NER), or when you write description, the text get indexed and you can find it with search.</p>By default, the search is very aggressive, so it should work well with OCR texts also.<br> <br><p>If you have any ideas of how search should work, then contact ari.hayrinen@jyu.fi </p> 
                      <div class="alert alert-info m-2">The search is not fully functional yet.</div>
                      </v-card>
                  </div>

                </v-col>

                <!-- right COLUMN -->
                <v-col cols="4" class="column_text2">
                  
                  <v-text-field v-model="state.search" @keydown.enter="search()" label="Search"></v-text-field>


                  <v-chip v-for="type of state.types" color="blue" @click:close="state.types = state.types.filter(t => t != type)" closable>{{type}}</v-chip>
                  <v-chip v-for="desk in state.desks" color="green" @click:close="state.desks = state.desks.filter(d => d != desk)" closable>{{state.projects.find(p => p.value == desk).title}}</v-chip>

                  <!-- FILTERS-->
                  <v-expansion-panels multiple>
                      <v-expansion-panel title="Filters">
                        <v-expansion-panel-text>
  
                          <v-expansion-panels>


                            <v-expansion-panel
                              title="Types"
                            >
                            <v-expansion-panel-text>
                             
                              <v-checkbox v-model="state.types" density="compact" value="text" label="Texts"></v-checkbox>

                            </v-expansion-panel-text>
                            </v-expansion-panel>

                            <v-expansion-panel
                              title="Desks"
                            >
                            <v-expansion-panel-text>
                             
                              <v-checkbox v-model="state.desks" density="compact" v-for="desk in state.projects" :label="desk.title" :value="desk.value"></v-checkbox>
                            </v-expansion-panel-text>
                            </v-expansion-panel>

                          </v-expansion-panels>
                          

                          </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>


                    <!-- SEARCH RESULTS -->

                    <v-container >
                      <template v-if="state.result.response">
                          <!-- {{ state.result.response.docs}} -->
                        <v-card @click="go(item.id)" v-for="item in state.result.response.docs" :key="item" class="mt-2">
                          <v-card-title >
                            <div > {{item.label}} ({{item.type}}) {{item.id}} </div>
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


