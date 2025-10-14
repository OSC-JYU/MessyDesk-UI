<style>
    .chip-flat {
        size: 10px;
    }
</style>

<template>
    <v-container>
        <template v-if="store.current_node" class="overflow-y-auto graph-display mt-4">
            <div>
                <div v-if="state.service_count === 0" class="alert alert-warning">No crunchers found. </div>

                <v-expansion-panels v-model="openPanel" @update:model-value="onPanelChange">
                    <v-expansion-panel v-for="service in services.result.for_format" :key="service.id">
                        <template v-if="service.id !== 'thumbnailer' && Object.keys(service.tasks).length > 0">
                            <v-expansion-panel-title>
                                <div class="d-flex flex-column">
                                    <div class="d-flex align-center">
                                        <h4 class="text-h5 font-weight-bold">{{ service.name }}</h4>
                                        <v-chip :color="service.access === 'proprietary' ? 'danger' : 'success'" size="small" variant="tonal" class="ml-2 chip-flat">
                                            {{ service.access === 'proprietary' ? 'proprietary' : 'open source' }}
                                        </v-chip>
                                        <v-chip :color="service.location === 'external' ? 'danger' : 'success'" :prepend-icon="service.location === 'external' ? 'mdi-alert-circle' : 'mdi-check-circle'" size="small" variant="flat" class="ml-2">
                                            {{ service.location === 'external' ? 'external' : 'on-premise' }}
                                        </v-chip>
                                        <v-chip  :color="service.status === 'experimental' ? 'danger' : 'success'" :prepend-icon="service.status === 'experimental' ? 'mdi-alert-circle' : 'mdi-check-circle'" size="small" variant="outlined" class="ml-2">
                                            {{ service.status === 'experimental' ? 'experimental' : 'stable' }}
                                        </v-chip>
                                        <a v-if="service.source_url" :href="service.source_url" target="_blank" title="more info" class="text-decoration-none ml-2">
                                            <v-icon start icon="mdi-open-in-new" class="mr-2"></v-icon>
                                        </a>
                                    </div>
                                    <span class="text-caption text-medium-emphasis">{{ service.description }}</span>
                                    <!-- <div v-if="state.current_queue">
                                            queue: {{ state.current_queue[service.id].num_pending}}
                                            batch: {{ state.current_queue[service.id + '_batch'].num_pending}}
                                       
                                    </div> -->
                                </div>
                            </v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <div v-if="service.location === 'external'">
                                    <v-alert type="error" variant="tonal">
                                        
                                        This cruncher is <b>external</b> and requires an API key. <br><b>Your data WILL BE SENT to the external service!</b> 
                                    </v-alert>
                                </div>
                                
                                <!-- Model Selection for services with models -->
                                <div v-if="service.models && Object.keys(service.models).length > 0" class="mb-4">
                                    <div class="text-h6 mb-3 d-flex align-center">
                                        <v-icon icon="mdi-brain" class="mr-2"></v-icon>
                                        Model Selection
                                    </div>
                                    
                                    <!-- Single model case -->
                                    <div v-if="Object.keys(service.models).length === 1">
                                        <v-card variant="outlined" class="pa-3">
                                            <div class="d-flex align-center mb-2">
                                                <strong>{{ Object.values(service.models)[0].name }}</strong>
                                                <v-chip size="small" variant="tonal" class="ml-2">
                                                    {{ Object.values(service.models)[0].output }}
                                                </v-chip>
                                            </div>
                                            <div v-if="Object.values(service.models)[0].description" class="text-body-2 text-medium-emphasis mb-1">
                                                {{ Object.values(service.models)[0].description }}
                                            </div>
                                            <div class="text-caption text-medium-emphasis">
                                                Supported input types: {{ Object.values(service.models)[0].supported_types?.join(', ') || 'all' }}
                                            </div>
                                        </v-card>
                                    </div>
                                    
                                    <!-- Multiple models case - show selection or selected model -->
                                    <div v-else>
                                        <!-- Show selected model as chip with option to change -->
                                        <div v-if="state.selected_model" class="d-flex align-center">
                                            <v-chip 
                                                :color="service.models[state.selected_model]?.output === 'text' ? 'blue' : 'green'"
                                                variant="tonal"
                                                size="large"
                                                class="mr-2">
                                                <v-icon start icon="mdi-brain"></v-icon>
                                                {{ service.models[state.selected_model].name }}
                                            </v-chip>
                                            <v-btn 
                                                size="small" 
                                                variant="text" 
                                                @click="state.selected_model = null"
                                                class="text-caption">
                                                Change
                                            </v-btn>
                                        </div>
                                        
                                        <!-- Show model selection options -->
                                        <div v-else>
                                            <v-radio-group v-model="state.selected_model" @update:model-value="onModelSelect(service)">
                                                <v-radio 
                                                    v-for="(model, modelId) in service.models" 
                                                    :key="modelId"
                                                    :value="modelId"
                                                    class="mb-3">
                                                    <template v-slot:label>
                                                        <div class="d-flex flex-column">
                                                            <div class="d-flex align-center mb-1">
                                                                <strong>{{ model.name }}</strong>
                                                                <v-chip size="small" variant="tonal" class="ml-2">
                                                                    {{ model.output }}
                                                                </v-chip>
                                                            </div>
                                                            <div v-if="model.description" class="text-body-2 text-medium-emphasis mb-1">
                                                                {{ model.description }}
                                                            </div>
                                                            <div class="text-caption text-medium-emphasis">
                                                                Supported input types: {{ model.supported_types?.join(', ') || 'all' }}
                                                            </div>
                                                        </div>
                                                    </template>
                                                </v-radio>
                                            </v-radio-group>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- DSpace Query Form for DSpace services -->
                                <!-- <div v-if="service.id === 'md-dspace7' ">
                                    <DspaceQueryForm 
                                        :dspace-url="service.dspace_url || ''"
                                        :source-rid="store.current_node.id"
                                        @query-executed="handleDspaceQuery"
                                    />
                                </div> -->
                                <!-- Show tasks only if no models or model is selected -->
                                <div v-if="!service.models || Object.keys(service.models).length === 0 || state.selected_model || (service.models && Object.keys(service.models).length === 1)">
                                    <v-expansion-panels>
                                        <v-expansion-panel v-for="(task, task_key) of service.tasks" :key="task_key">
                                        <v-expansion-panel-title>
                                            <div class="font-weight-bold">{{ task.name }}</div>
                                            <span class="text-caption ml-2">{{ task.description }}</span>
                                        </v-expansion-panel-title>
                                        <v-expansion-panel-text>
                                            <!-- Show selected model info -->
                                            <div v-if="service.models && state.selected_model" class="mb-3">
                                                <div class="text-body-2 d-flex align-center pa-2" style="background-color: rgba(var(--v-theme-primary), 0.1); border-radius: 4px;">
                                                    <v-icon icon="mdi-brain" class="mr-2" size="small"></v-icon>
                                                    <strong>Selected Model:</strong>
                                                    <span class="ml-2">{{ service.models[state.selected_model].name }}</span>
                                                    <v-chip size="small" variant="tonal" class="ml-2">
                                                        {{ service.models[state.selected_model].output }}
                                                    </v-chip>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <!-- task specific settings -->
                                                <div v-if="task.content" class="mt-4 mb-4">
                                                    <v-alert type="info" variant="tonal">
                                                       
                                                        {{ task.content }}
                                                    </v-alert>
                                                </div>
                                                <div v-if="task.params_help">
                                                    <div v-for="(help, key) in task.params_help" :key="key" class="input-group mb-3">
                                                        <v-container style="width: 100%">
                                                            <b>{{ help.name }}</b>
                                                            <div><i>{{ help.help }}</i></div>
                                                        </v-container>
                                                        <template v-if="help.component && help.component == 'dspace'">
                                                            <DspaceQueryForm :dspace-url="service.dspace_url || ''" :source-rid="store.current_node.id" @query-executed="handleDspaceQuery" />
                                                        </template>
                                                        <template v-else-if="help.display && help.display == 'checkbox'">
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
                                                <div v-else></div>
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
                                            <div v-else-if="service.supported_formats"><b>supported formats: {{ service.supported_formats.join(', ') }}</b></div>
                                            <div v-else><b>supported formats: all</b></div>
                                        </v-expansion-panel-text>
                                    </v-expansion-panel>
                                </v-expansion-panels>
                                </div>
                                
                                <!-- Show message when model selection is required -->
                                <div v-else-if="service.models && Object.keys(service.models).length > 1 && !state.selected_model" class="mt-4">
                                    <div class="text-body-2 text-medium-emphasis d-flex align-center">
                                        <v-icon icon="mdi-information" class="mr-2" size="small"></v-icon>
                                        Please select a model above to see available tasks.
                                    </div>
                                </div>
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
    import DspaceQueryForm from "./DspaceQueryForm.vue";

    const route  = useRoute();
    const router = useRouter();

    var services = reactive({result:{}})

    var openPanel = ref(null)
 
    var state = reactive({
		current_type: '',
		current_schema: null,
		out_params: {},
		user_info: '',
		error: '',
        service_count: 0,
        current_queue: null,
        selected_service: null,
        selected_model: null,
        show_model_selection: false
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

    async function onPanelChange(value) {
        state.current_queue = null
        state.selected_service = null
        state.selected_model = null
        state.show_model_selection = false
        
        if (value !== null && value !== undefined) {
            const openedService = services.result.for_format[value]
            console.log('Panel opened:', openedService.name, openedService.id)
            
            state.selected_service = openedService
            
            // If service has models, handle model selection
            if (openedService.models && Object.keys(openedService.models).length > 0) {
                if (Object.keys(openedService.models).length === 1) {
                    // Single model - auto-select it
                    state.selected_model = Object.keys(openedService.models)[0]
                } else {
                    // Multiple models - show selection
                    state.show_model_selection = true
                }
            }

            var queue = await web.getQueue(openedService.id)
            state.current_queue = queue
            
            // Make your API call here
            // For example:
            // loadServiceDetails(openedService.id)
        }
    }
    
    function onModelSelect(service) {
        console.log('Model selected:', state.selected_model, 'for service:', service.id)
        // Model selection is handled, tasks can now be shown
    }

    function getQueue(node) {
        console.log(node)
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

		var task_object = {service: service.id, id: task_id}
		task_object.params = task.values
		//process.params.task = task_id
	    if(task.info) task_object.info = task.info

        // Add model information if service has models
        if (service.models && state.selected_model) {
            task_object.model = state.selected_model  // details of model are added in backend
        }

        if(service.external_tasks) {
            console.log('external tasks')
            task_object.name = task.name
            task_object.description = task.description
            task_object.system_params = task.system_params
        }
        if(task.output_type) task_object.system_params.output_type = task.output_type
        if(task.json_schema) task_object.system_params.json_schema = task.json_schema

		if(task.info) {
			console.log('INFO LÖYTYI')
			task_object.info = createUserInfo(task.info, task.values)
		}
		console.log(task_object)
        
        if(store.current_node.data.type == 'source') {
            var res = await web.createSourceProcess(task_object, store.current().id)
        } else if(store.current_node.data.type == 'set') {
            var res = await web.createSetProcess(task_object, store.current().id)
        } else  if (store.cruncher_filter == 'ROI') {
            var res = await web.createROIProcess(task_object, store.current().id)
        } else {
            var res = await web.createFileProcess(task_object, store.current().id)
        }
		// //var node = res.data.result[0]
        store.crunchers_open = false
		// //console.log(res)
		// //store.reload()
		// close(1)

	}

    // Handle DSpace query execution
    async function handleDspaceQuery(query) {
        console.log('DSpace query executed:', query)
        const service = 'md-dspace7'
        const task = 'make_query'
        const params = {query: query.solrQuery}
        const task_object = {service: service, id: task, params: params}
        await web.createSourceProcess(task_object, store.current().id)
    }


    onMounted(async()=> {
        if(route.query.node) {
           loadData(route.query.node)
          
        }
    })

</script>
