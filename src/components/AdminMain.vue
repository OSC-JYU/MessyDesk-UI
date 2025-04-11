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
        users: [],
        from_request:'',
        services: [],
        requests: [],
        add: false,
        new_label: "",
        new_email: "",
        tab: 0,
        request_headers: [
            {
                title: 'Name',
                key: 'label', 
                sortable: true
            },
            {
                title: 'Email',
                key: 'id', 
                sortable: true
            },
            {
                title: 'Rights',
                key: 'access', 
                sortable: true
            },
        ],
        headers: [
            {
                title: 'Name',
                key: 'label', 
                sortable: true
            },
            {
                title: 'Email',
                key: 'id', 
                sortable: true
            },
            {
                title: 'Rights',
                key: 'access', 
                sortable: true
            },
            {
                title: 'Service Groups',
                key: 'service_groups', 
                sortable: true
            },
            {
                title: 'RID',
                key: '@rid', 
                sortable: true
            },
            {
                title: 'active',
                key: 'active', 
                sortable: true
            },
        ],
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
        ]
    })

    async function search(type) {
      state.current_type = type
      var response = await web.getUsers(type)
      state.result = response.result
    }

    function openUserDialog(label, email, rid) {
      console.log(rid)
      state.tab = 1
      state.new_label = label
      state.new_email = email
      state.from_request = rid
      state.add = true
    }

    async function removeRequest(rid) {
      await web.removePermissionRequest(rid)
      state.requests = await web.getPermissionRequests()
    }

    async function createUser() {
      var response = await web.createUser({label:state.new_label, id:state.new_email})
      if(state.from_request != '') {
        await web.removePermissionRequest(state.from_request)
        state.requests = await web.getPermissionRequests()
      }
      state.users = await web.getUsers()
      cancelCreateUser()
    }

    function cancelCreateUser() {
      state.add = false
      state.from_request = ''
      state.new_email = ''
      state.new_label = ''
    }

    onMounted(async()=> {
      state.users = await web.getUsers()
      state.requests = await web.getPermissionRequests()
      var response = await web.getServices()
      for(var key in response) {
        response[key]['active'] = false
        if(response[key]['consumers'].length) {
          response[key]['active'] = true
        }
        state.services.push(response[key])
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

                  <v-tab >Requests</v-tab>
                  <v-tab>Users</v-tab>
                  <v-tab>Services</v-tab>

                </v-tabs>

              </v-row>


              <v-tabs-window v-model="state.tab">


                <v-tabs-window-item>
                  <v-container>
                    
                    <v-data-table :items="state.requests" :headers="state.request_headers" >

                      <template v-slot:item.access="{ item }">
                        <v-btn color="primary" @click="openUserDialog(item['id'], item['id'], item['@rid'])">Accept</v-btn>
                        <v-btn color="danger" @click="removeRequest(item['@rid'])" class="ml-8"><v-icon>mdi-trash-can</v-icon>Remove</v-btn>
                      </template>


                    </v-data-table>
                    
      

                  </v-container>

                </v-tabs-window-item> 


                <v-tabs-window-item>
                    <v-container>
                      
                      <template v-if="state.result && !state.add">
                        <v-data-table :items="state.users" :headers="state.headers">
                          
                          <template v-slot:item.active="{ item }">
                            <v-checkbox-btn
                            v-model="item.active"
                            readonly
                          ></v-checkbox-btn>
                        </template>
                        
                        <template v-slot:item.label="{ item }">
                          <div @click="go(item['@rid'])">{{item.label}}  </div>
                        </template>
                        
                      </v-data-table>
                      
                    </template>
                    
                    <v-btn v-if="!state.add" class="btn-primary btn-primary" @click="state.add  = true">Add new</v-btn> 

                    <!-- ADD USER -->
                    <div v-if="state.add">  
                      <v-card title="Add new user">
                      <v-card-text>
                        <v-text-field v-model="state.new_label" label="Lastname, Firstname"></v-text-field>
                        <v-text-field v-model="state.new_email" label="email"></v-text-field>
                        <v-btn @click="cancelCreateUser()">Cancel</v-btn>
                        <v-btn @click="createUser()" color="primary" class="ml-6">Create</v-btn>
                        From request {{ state.from_request }}
                      </v-card-text>
                      </v-card>
                    </div>
                    <!-- ADD USER ends-->
                  </v-container>

                </v-tabs-window-item> 
                
                <v-tabs-window-item>
                  <v-container>
                    
                    <v-data-table :items="state.services" :headers="state.service_headers" >

                      <template v-slot:item.description="{ item }">
                        <div >{{item.description}} <p><a target="_blank" :href="item.source_url">{{ item.source_url }}</a></p> </div>
                      </template>

                      <!-- <template v-slot:item.tasks="{ item }">
                        <div v-for="task in item.tasks" :key="task">
                        {{task}}</div>
                      </template> -->

                    </v-data-table>
                    
                    {{ state.services }}

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


