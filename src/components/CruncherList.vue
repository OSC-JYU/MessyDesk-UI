

<style>
.graph-display { 
width: 100%;
height: 100%;
}

</style>

<template>


    <v-container  class="h-100 w-100 position-absolute">
        
      <v-row>
        <v-btn @click="$router.go(-1)"><v-icon>mdi-arrow-left</v-icon></v-btn>
      </v-row>
    
        <v-card v-if="store.current_node" class="overflow-y-auto graph-display mt-4">

    

            <!-- CRUNCHERS -->

                <div>
                    
                    <div v-if="services.result && services.result.for_format && services.result.for_format.length == 0" class="alert alert-warning">No crunchers found</div>

                    <div v-if="store.current().data.type == 'set'">
                        <ol class="card" v-for="service in services.result.for_type">
                            <template v-if="service.tasks">
                                <li class="list-group-item border-0" v-for="(value, key) of service.tasks" :key="key">
                                    <div @click="initProcessCreator(service, key)" class="node Service pointer"> {{ value.name }} </div>
                                    <div class="rel-info">{{ value.description }}</div><div class="badge rel-info bg-secondary">{{service.name}}</div>
                                </li>
                            </template>
                        </ol>
                    </div>


                        <template v-for="service in services.result.for_format">
                            <template v-if="service.id !== 'thumbnailer'">
                            <h4 class="text-h5 font-weight-bold mb-4 mt-6"> {{ service.name }}</h4>
                            <p><i> {{ service.description }}</i></p> 
                            <v-expansion-panels>
                                <v-expansion-panel v-for="(value, key) of service.tasks" >
                                    <v-expansion-panel-title> 
                                        <div class="font-weight-bold "> {{ value.name }}</div>
                                    </v-expansion-panel-title>
                                    <v-expansion-panel-text>
                                         {{ value.description }}
                                         <div class="d-flex flex-row-reverse mb-6 ">
                                             <v-btn         
                                                class="text-none ms-4 text-white"
                                                color="blue-darken-4"
                                                rounded="1"
                                                variant="flat" 
                                                title="Add cruncher"
                                                @click="initProcessCreator(service, key)">Add</v-btn>

                                         </div>
                                    </v-expansion-panel-text>

                                </v-expansion-panel>
                            </v-expansion-panels>
                            </template>

                        </template>



                    <div>
                </div>
            </div>
        </v-card>
       
        <div v-else class="mt-10">ERROR: No node selected</div>
    </v-container>

</template>




<script setup>
    import { onMounted, watch, reactive, ref, computed } from "vue";
    import { useRouter, useRoute } from 'vue-router'
    import {store} from "./Store.js";
    import web from "../web.js";

    const route  = useRoute();
    const router = useRouter();

    var services = reactive({result:{}})
 

    async function loadData(rid) {
        services.result = await web.getServicesForFile(rid)
    }


    function initProcessCreator(data, task_id) {
        console.log(data)
        store.process = data
        store.task_id = task_id
        store.new_node_label = 'Process'
        store.new_node_relation = 'WAS_PROCESSED_BY'
        store.process_creator_open = true
    }





    function removeLastPathPart(str) {
        const lastIndex = str.lastIndexOf('/');
        if (lastIndex !== -1) {
            return str.substring(0, lastIndex);
        }
        return str;
        }

    onMounted(async()=> {
        console.log('pam')
        if(route.query.node) {
           loadData(route.query.node)
           store.reload()
        }
    })

</script>
