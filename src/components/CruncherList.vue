<template>
    <v-container>
        <template v-if="store.current_node" class="overflow-y-auto graph-display mt-4">
            <div>
                <div v-if="state.service_count === 0" class="alert alert-warning">No crunchers found</div>

                <v-expansion-panels>
                    <v-expansion-panel v-for="service in services.result.for_format" :key="service.id">
                        <template v-if="service.id !== 'thumbnailer' && Object.keys(service.tasks).length > 0">
                            <v-expansion-panel-title>
                                <div class="d-flex flex-column">
                                    <div class="d-flex align-center">
                                        <h4 class="text-h5 font-weight-bold">{{ service.name }}</h4>
                                        <v-chip label :color="service.access === 'commercial' ? 'danger' : 'success'" variant="tonal" class="ml-2">
                                            {{ service.access === 'commercial' ? 'commercial' : 'free' }}
                                        </v-chip>
                                    </div>
                                    <span class="text-caption text-medium-emphasis">{{ service.description }}</span>
                                </div>
                            </v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <v-expansion-panels>
                                    <v-expansion-panel v-for="(task, task_key) of service.tasks" :key="task_key">
                                        <v-expansion-panel-title>
                                            <div class="font-weight-bold">{{ task.name }}</div>
                                            <span class="text-caption ml-2">{{ task.description }}</span>
                                        </v-expansion-panel-title>
                                        <v-expansion-panel-text>
                                            <div>
                                                <!-- task specific settings -->
                                                <div v-if="task.content" class="mt-4 mb-4">
                                                    <v-alert type="info" variant="tonal">
                                                        <v-icon start icon="mdi-message-text" class="mr-2"></v-icon>
                                                        {{ task.content }}
                                                    </v-alert>
                                                </div>
                                                <div v-if="task.params_help">
                                                    <div v-for="(help, key) in task.params_help" :key="key" class="input-group mb-3">
                                                        <v-container style="width: 100%">
                                                            <b>{{ help.name }}</b>
                                                            <div><i>{{ help.help }}</i></div>
                                                        </v-container>
                                                        
                                                        <template v-if="help.display && help.display == 'checkbox'">
                                                            <v-checkbox v-model="task.values[key]" v-for="value in help.values" :label="value.title" :value="value.value"></v-checkbox>
                                                        </template>
                                                        <template v-else-if="help.display && help.display == 'dropdown'">
                                                            <v-select v-model="task.values[key]" :items="help.values"></v-select>
                                                        </template>
                                                        <template v-else>   
                                                            <input v-model="task.values[key]" type="text" class="form-control" placeholder="" aria-label="Username" aria-describedby="basic-addon1">
                                                        </template>
                                                    </div>
                                                </div>
                                                <!-- common settings -->
                                                <div v-else-if="service.params_help">
                                                    <div v-for="(help, key) in service.params_help" :key="key" class="input-group mb-3">
                                                        <v-container style="width: 100%">
                                                            <b>{{ help.name }}</b>
                                                            <div><i>{{ help.help }}</i></div>
                                                        </v-container>
                                                        <input v-model="task.values[key]" type="text" class="form-control" placeholder="" aria-label="Username" aria-describedby="basic-addon1">
                                                    </div>
                                                </div>
                                                <div v-else>This cruncher has no settings, just click "Crunch!".</div>
                                            </div>

                                            <div class="d-flex flex-row-reverse mb-6">
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

                                            <div v-if="task.supported_formats"><b>supported formats: {{ task.supported_formats.join(', ') }}</b></div>
                                            <div v-else><b>supported formats: {{ service.supported_formats.join(', ') }}</b></div>
                                        </v-expansion-panel-text>
                                    </v-expansion-panel>
                                </v-expansion-panels>
                            </v-expansion-panel-text>
                        </template>
                    </v-expansion-panel>
                </v-expansion-panels>
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
            
            // Convert tasks object to array, sort by name, and convert back to object
            const sortedTasks = Object.entries(service.tasks)
                .sort(([, a], [, b]) => a.name.localeCompare(b.name))
                .reduce((acc, [key, value]) => {
                    acc[key] = value;
                    return acc;
                }, {});
            
            service.tasks = sortedTasks;
            
            for(var task in service.tasks) {
                service.tasks[task].values = {}
                if(service.tasks[task].params_help) {
                    for(var param in service.tasks[task].params_help) {
                        // sefault value for text input
                        service.tasks[task].values[param] = service.tasks[task].params_help[param].default
                        if(service.tasks[task].params_help[param].multi) service.tasks[task].values[param] = []
                    }
                }
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
        console.log(service)
        console.log(task)

		state.error = ''

		var process = {id: service.id, task: task_id}
		process.params = task.values
		process.params.task = task_id
	    if(task.info) process.info = task.info
        if(service.external_tasks) {
            console.log('external tasks')
            process.name = task.name
            process.description = task.description
            process.system_params = task.system_params
        }

		if(task.info) {
			console.log('INFO LÖYTYI')
			process.info = createUserInfo(task.info, task.values)
		}
		console.log(process)
        
        if(store.current_node.data.type == 'source') {
            var res = await web.createSourceProcess(process, store.current().id)
        } else if(store.current_node.data.type == 'set') {
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
