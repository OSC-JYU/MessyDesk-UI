



<template>


    <v-container  >
        

        <template v-if="store.current_node" class="overflow-y-auto graph-display mt-4">

    

            <!-- CRUNCHERS -->

                <div>
                    
                    <div v-if="state.service_count === 0" class="alert alert-warning">No crunchers found</div>

                    <!-- <div v-if="store.current().data.type == 'set'">
                        <ol class="card" v-for="service in services.result.for_type">
                            <template v-if="service.tasks">
                                <li class="list-group-item border-0" v-for="(value, key) of service.tasks" :key="key">
                                    <div @click="initProcessCreator(service, key)" class="node Service pointer"> {{ value.name }} </div>
                                    <div class="rel-info">{{ value.description }}</div><div class="badge rel-info bg-secondary">{{service.name}}</div>
                                </li>
                            </template>
                        </ol>
                    </div> -->


                        <v-sheet v-for="service in services.result.for_format">
                            <template v-if="service.id !== 'thumbnailer' && Object.keys(service.tasks).length > 0">
                                <h4 class="text-h5 font-weight-bold mb-4 mt-6"> {{ service.name }}</h4>
                                <p><i> {{ service.description }}</i></p> 
                               
                                <v-expansion-panels>
                                    <v-expansion-panel v-for="(task, task_key) of service.tasks" >
                                        <v-expansion-panel-title> 
                                            <div class="font-weight-bold "> {{ task.name }}</div>
                                        </v-expansion-panel-title>
                                        <v-expansion-panel-text>
                                            {{ task.description }}
         
                                           

                                            
                                            <div >
                                                <!-- task specific settings -->
                                                <div v-if="task.params_help">
                                                    <div v-for="(help, key) in task.params_help" :key="key" class="input-group mb-3">
                                                            <div class="input-group-prepend">
                                                                <span class="input-group-text" id="basic-addon1">{{ help.name }}</span>
                                                            </div>
                                                            
                                                            
                                                            <div >
                                                                <input v-model="task.values[key]" type="text" class="form-control" placeholder=""  aria-label="Username" aria-describedby="basic-addon1">
                                                                <div>{{ help.help }}</div>
                                                                <div v-if="help.values"	>{{ help.values }}</div>	
                                                            </div>
                                                            
                                                            
                                                            
                                                        </div>
                                                        
                                                    </div>
                                                    <!-- common settings -->
                                                    <div v-else-if="service.params_help" >
                                                        <div v-for="(help, key) in service.params_help" :key="key" class="input-group mb-3">
                                                            <div class="input-group-prepend">
                                                                <span class="input-group-text" id="basic-addon1">{{ help.name }}</span>
                                                            </div>
                                                            <input v-model="task.values[key]"  type="text" class="form-control" placeholder=""  aria-label="Username" aria-describedby="basic-addon1">
                                                            <div>{{ help.help }}</div>
                                                        </div>
                                                    </div>
                                                    <div v-else>This cruncher has no settings, just click "Crunch!".</div>
                                                </div>

                                                <div class="d-flex flex-row-reverse mb-6 ">
                                                <v-btn         
                                                class="text-none ms-4 text-white"
                                                color="blue-darken-4"
                                                rounded="1"
                                                variant="flat" 
                                                title="Add cruncher"
                                                @click="createProcess(service, task, task_key)">
                                                <template v-if="store.current().data.type == 'set'">Crunch files in Set</template>
                                                <template v-else>Crunch file</template>
                                            </v-btn>
                                                
                                            </div>

                                                <v-alert type="info" v-if="task.supported_formats">supported formats: {{ task.supported_formats.join(', ') }}</v-alert>
                                                <v-alert type="info" v-else>supported formats: {{ service.supported_formats.join(', ') }}</v-alert>




                                        </v-expansion-panel-text>
                                        

                                    </v-expansion-panel>
                                </v-expansion-panels>
                            </template>

                        </v-sheet>



                    <div>
                </div>
            </div>
        </template>
       
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
 
    var state = reactive({
		current_type: '',
		current_schema: null,
		out_params: {},
		user_info: '',
		error: '',
        service_count: 0
	})

    async function loadData(rid) {
        services.result = await web.getServicesForFile(store.current_node.id, store.cruncher_filter)
        for(var service of services.result.for_format) {
            if(service.id === 'thumbnailer') continue
            state.service_count += 1
            for(var task in service.tasks) {
                service.tasks[task].values = {}
            }
        }
    }

    function createUserInfo(info, params) {
		if(info) {
			console.log('params:')
			for(var key of Object.keys(params)) {
				console.log(key)
				info = info.replace('{{' + key + '}}', params[key])
                if(!params[key]) info = info.replace('{{' + key + '}}', 'Not given')
			}
            
			return info
		} else {
			return JSON.stringify(params)
		}
	}

    async function createProcess(service, task, task_id) {
        console.log(service.id)
        console.log(task)
		// we must send ELG "params" 
		// target
		state.error = ''



		var process = {id: service.id, task: task_id}
		process.params = task.values
		process.params.task = task_id
	    if(task.info) process.info = task.info

		if(task.info) {
			console.log('INFO LÖYTYI')
			process.info = createUserInfo(task.info, task.values)
		}
		console.log(process)

        if(store.current_node.data.type == 'set') {
            var res = await web.createSetProcess(process, store.current().id)
        } else  if (store.cruncher_filter == 'ROI') {
            var res = await web.createROIProcess(process, store.current().id)
        } else {
            var res = await web.createFileProcess(process, store.current().id)
        }
		// //var node = res.data.result[0]
        store.crunchers_open = false
		// //console.log(res)
		// //store.reload()
		// close(1)

	}


    onMounted(async()=> {
        if(route.query.node) {
           loadData(route.query.node)
          
        }
    })

</script>
