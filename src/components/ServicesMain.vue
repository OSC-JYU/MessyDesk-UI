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
    import JYUHeader_plain from './JYUHeader_plain.vue'
    import web from "../web.js";
    
    import { onMounted, reactive} from "vue";
    import { useRoute } from 'vue-router'

    const route = useRoute();

    document.title = "MessyDesk - search"


    var state = reactive({
        search: "",
        result: [],
        services: [],
        tasks: [],
        add: false,
        new_label: "",
        new_email: "",
        tab: 0,
        sortBy: 'active',

        service_headers: [
            {
                title: 'Service',
                key: 'name', 
                sortable: true
            },
            {
                title: 'queue ID',
                key: 'id', 
                sortable: true
            },
            {
                title: 'Description',
                key: 'description', 
                sortable: true
            },
            {
                title: 'Active',
                key: 'active', 
                sortable: true
            },
            {
                title: 'Consumers',
                key: 'consumers', 
                sortable: true
            }
        ],
        task_headers: [
            {
                title: 'Task',
                key: 'name', 
                sortable: true
            },
            {
                title: 'Description',
                key: 'description', 
                sortable: true
            },
            {
                title: 'Service',
                key: 'service', 
                sortable: true
            },
            {
                title: 'Media',
                key: 'supported_types', 
                sortable: true
            },
            {
                title: 'Access',
                key: 'access', 
                sortable: true
            }
        ]
    })


    onMounted(async()=> {
      var response = await web.getServices()
      for(var key in response) {
        response[key]['active'] = false
        if(response[key]['consumers'].length) {
          response[key]['active'] = true
        }
        state.services.push(response[key])

        // tasks
        if(response[key]['tasks']) {
          for(var task in response[key]['tasks']) {
            //state.tasks.push(response[key]['tasks'][task])
            var task_data = {name:response[key]['tasks'][task]['name']}
            task_data.access = 'free'
            if(response[key]['access']) {
              task_data.access = response[key]['access']
            }
            task_data.description = response[key]['tasks'][task]['description']
            task_data.service = key
            task_data.supported_types = response[key]['supported_types'][0]
            if(response[key]['tasks'][task]['supported_types']) {
              task_data.supported_types = response[key]['tasks'][task]['supported_types'][0]
            }
            state.tasks.push(task_data)
          }
        }
      }
    })



</script>



<template>

<v-card class="mx-auto fill-height" color="grey-lighten-3" flat>
    <v-layout class="fill-height">

      <JYUHeader_plain/>

      <v-main class="fill-height">
        <v-container class="fill-height pa-0" fluid>
          <v-row class="fill-height no-gutters" >

         


            <v-col
              class="d-flex fill-height overflow-auto"
              cols="12"
              color="light-blue lighten-3"
            >

            <v-container>

              <v-row class="mt-6">
                <v-tabs v-model="state.tab">

          
                  <v-tab>Tasks</v-tab>
                  <v-tab>Services</v-tab>

                </v-tabs>

              </v-row>


              <v-tabs-window v-model="state.tab">

                <v-tabs-window-item>
                  <v-container>
                    
                    <v-data-table :items="state.tasks" :headers="state.task_headers">
                      
                      </v-data-table>

                  </v-container>

                </v-tabs-window-item> 


                <v-tabs-window-item>
                  <v-container>
                    
                    <v-data-table :items="state.services" :headers="state.service_headers">

                      <template v-slot:item.description="{ item }">
                        <div >{{item.description}} <p><a target="_blank" :href="item.source_url">{{ item.source_url }}</a></p> </div>
                      </template>

                    </v-data-table>
                    

                  </v-container>

                </v-tabs-window-item> 




              </v-tabs-window>


            </v-container>
            </v-col>

          </v-row>
        </v-container>
      </v-main>
    </v-layout>
  </v-card>  


 
  </template>


