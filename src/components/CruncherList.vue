<style>
    .chip-flat {
        size: 10px;
    }
</style>

<template>
    <v-container>
        <template v-if="store.current_node" class="overflow-y-auto graph-display mt-4">
            <div>
                <v-tabs
                    v-model="state.activeTab"
                    color="primary"
                    class="mb-4"
                    align-tabs="start"
                >
                    <v-tab value="services">
                        <v-icon start icon="mdi-view-module"></v-icon>
                        By Service
                    </v-tab>
                    <v-tab value="tasks">
                        <v-icon start icon="mdi-format-list-bulleted"></v-icon>
                        By Task
                    </v-tab>
                    <v-tab value="filters">
                        <v-icon start icon="mdi-filter-variant"></v-icon>
                        Filters
                    </v-tab>
                </v-tabs>

                <v-window v-model="state.activeTab" class="mt-2" :transition="false" :reverse-transition="false">
                    <v-window-item value="services">
                <div v-if="state.service_count === 0" class="alert alert-warning">No crunchers found. </div>

                <v-expansion-panels v-model="openPanel" @update:model-value="onPanelChange">
                    <v-expansion-panel v-for="service in services.result.for_format" :key="service.id">
                        <template v-if="service.id !== 'thumbnailer' && Object.keys(service.tasks).length > 0">
                            <v-expansion-panel-title>
                                <div class="d-flex flex-column">
                                    <div class="d-flex align-center">
                                        <h5 >{{ service.name }}</h5>
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
                                

                                <!-- Show tasks only if no models or model is selected -->
                                <div v-if="!service.models || Object.keys(service.models).length === 0 || state.selected_model || (service.models && Object.keys(service.models).length === 1)">
                                    <v-expansion-panels>
                                        <v-expansion-panel v-for="(task, task_key) of service.tasks" :key="task_key">
                                        <v-expansion-panel-title>
                                            <div class="font-weight-bold">{{ task.name }}</div>
                                            <span class="text-caption ml-2">{{ task.description }}</span>
                                            <v-chip size="small" variant="tonal" class="ml-2">
                                                {{ task.output_type === 'json' ? 'JSON' : 'Text' }}
                                            </v-chip>
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
                                            <div v-else>supported formats: all</div>
                                            <div v-if="task.output_type">output type: {{ task.output_type }}</div>
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
                    </v-window-item>

                    <v-window-item value="tasks">
                        <div v-if="allTasks.length === 0" class="alert alert-info">No tasks available.</div>
                        <v-expansion-panels>
                            <v-expansion-panel v-for="item in allTasks" :key="item.serviceId + '__' + item.taskKey">
                                <v-expansion-panel-title>
                                    <div class="font-weight-bold">{{ item.task.name }}</div>
                                    <span class="text-caption ml-2">{{ item.task.description }}</span>
                                    <v-chip size="small" variant="tonal" class="ml-2">
                                        {{ item.task.output_type === 'json' ? 'JSON' : 'Text' }}
                                    </v-chip>
                                    <v-chip size="small" class="ml-2" color="primary" variant="flat">
                                        <v-icon start icon="mdi-cog"></v-icon>
                                        {{ item.serviceName }}
                                    </v-chip>
                                </v-expansion-panel-title>
                                <v-expansion-panel-text>
                                    <div>
                                        <!-- task specific settings -->
                                        <div v-if="item.task.content" class="mt-4 mb-4">
                                            <v-alert type="info" variant="tonal">
                                                {{ item.task.content }}
                                            </v-alert>
                                        </div>
                                        <div v-if="item.task.params_help">
                                            <div v-for="(help, key) in item.task.params_help" :key="key" class="input-group mb-3">
                                                <v-container style="width: 100%">
                                                    <b>{{ help.name }}</b>
                                                    <div><i>{{ help.help }}</i></div>
                                                </v-container>
                                                <template v-if="help.component && help.component == 'dspace'">
                                                    <DspaceQueryForm :dspace-url="item.service.dspace_url || ''" :source-rid="store.current_node.id" @query-executed="handleDspaceQuery" />
                                                </template>
                                                <template v-else-if="help.display && help.display == 'checkbox'">
                                                    <v-checkbox v-model="item.task.values[key]" v-for="value in help.values" :label="value.title" :value="value.value"></v-checkbox>
                                                </template>
                                                <template v-else-if="help.display && help.display == 'dropdown'">
                                                    <v-select v-model="item.task.values[key]" :items="help.values"></v-select>
                                                </template>
                                                <template v-else>
                                                    <input v-model="item.task.values[key]" type="text" class="form-control" placeholder="" aria-label="Username" aria-describedby="basic-addon1">
                                                </template>
                                            </div>
                                        </div>
                                        <!-- common settings -->
                                        <div v-else-if="item.service.params_help">
                                            <div v-for="(help, key) in item.service.params_help" :key="key" class="input-group mb-3">
                                                <v-container style="width: 100%">
                                                    <b>{{ help.name }}</b>
                                                    <div><i>{{ help.help }}</i></div>
                                                </v-container>
                                                <template v-if="help.component && help.component == 'dspace'">
                                                    <DspaceQueryForm :dspace-url="item.service.dspace_url || ''" :source-rid="store.current_node.id" @query-executed="handleDspaceQuery" />
                                                </template>
                                                <template v-else-if="help.display && help.display == 'checkbox'">
                                                    <v-checkbox v-model="item.task.values[key]" v-for="value in help.values" :label="value.title" :value="value.value"></v-checkbox>
                                                </template>
                                                <template v-else-if="help.display && help.display == 'dropdown'">
                                                    <v-select v-model="item.task.values[key]" :items="help.values"></v-select>
                                                </template>
                                                <template v-else>
                                                    <input v-model="item.task.values[key]" type="text" class="form-control" placeholder="" aria-label="Username" aria-describedby="basic-addon1">
                                                </template>
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
                                            @click="createProcess(item.service, item.task, item.taskKey)">
                                            <template v-if="store.current().data.type == 'set'">Crunch files in Set</template>
                                            <template v-else>Crunch file</template>
                                        </v-btn>
                                    </div>

                                    <div v-if="item.task.supported_formats"><b>supported formats: {{ item.task.supported_formats.join(', ') }}</b></div>
                                    <div v-else-if="item.service.supported_formats"><b>supported formats: {{ item.service.supported_formats.join(', ') }}</b></div>
                                    <div v-else>supported formats: all</div>
                                    <div v-if="item.task.output_type">output type: {{ item.task.output_type }}</div>
                                </v-expansion-panel-text>
                            </v-expansion-panel>
                        </v-expansion-panels>
                    </v-window-item>

                    <v-window-item value="filters">
                        <div v-if="filtersList.length === 0" class="alert alert-info">No filters available.</div>
                        <div v-if="state.filter_operation_message" class="alert alert-info">
                            {{ state.filter_operation_message }}
                        </div>
                        <v-expansion-panels v-else>
                            <v-expansion-panel v-for="filter in filtersList" :key="filter.id">
                                <v-expansion-panel-title>
                                    <div class="font-weight-bold">{{ filter.name || filter.id }}</div>
                                    <span class="text-caption ml-2">{{ filter.description }}</span>
                                </v-expansion-panel-title>
                                <v-expansion-panel-text>
                                    <div class="d-flex flex-row-reverse mb-4">
                                        <v-btn
                                            class="text-none ms-4 text-white"
                                            color="blue-darken-4"
                                            rounded="1"
                                            variant="flat"
                                            title="Create filter"
                                            :loading="state.filter_creating_id === filter.id"
                                            :disabled="Boolean(state.filter_creating_id)"
                                            @click="createFilter(filter)">
                                            Create Filter
                                        </v-btn>
                                    </div>
                                    <div v-if="filter.supported_types && filter.supported_types.length">
                                        <b>supported types: {{ filter.supported_types.join(', ') }}</b>
                                    </div>
                                    <div v-else>supported types: all</div>
                                    <div v-if="filter.supported_formats && filter.supported_formats.length">
                                        <b>supported formats: {{ filter.supported_formats.join(', ') }}</b>
                                    </div>
                                    <div v-else>supported formats: all</div>
                                </v-expansion-panel-text>
                            </v-expansion-panel>
                        </v-expansion-panels>
                    </v-window-item>
                </v-window>

                <v-dialog v-model="state.tag_filter_open" max-width="720">
                    <v-card>
                        <v-card-title class="text-h6">Create Tag Filter Set</v-card-title>
                        <v-card-text>
                            <div class="text-body-2 mb-3">
                                Select filter task. A new Set will be created with reference file nodes.
                            </div>

                            <v-select
                                v-model="state.tag_filter_mode"
                                :items="state.tag_filter_mode_options"
                                item-title="title"
                                item-value="value"
                                label="Filter task"
                                variant="outlined"
                            />

                            <v-select
                                v-if="state.tag_filter_mode !== 'untagged'"
                                v-model="state.tag_filter_selected_entities"
                                :items="state.tag_filter_entities"
                                item-title="title"
                                item-value="value"
                                label="Tags"
                                multiple
                                chips
                                clearable
                                variant="outlined"
                            />

                            <v-radio-group v-if="state.tag_filter_mode === 'include'" v-model="state.tag_filter_match" inline label="Match logic" class="mt-2">
                                <v-radio label="OR (any selected tag)" value="or" />
                                <v-radio label="AND (all selected tags)" value="and" />
                            </v-radio-group>

                            <v-text-field
                                v-model="state.tag_filter_set_label"
                                label="Output Set label (optional)"
                                variant="outlined"
                                density="comfortable"
                                class="mt-2"
                            />

                            <div v-if="state.tag_filter_error" class="alert alert-danger mt-2 mb-0">
                                {{ state.tag_filter_error }}
                            </div>
                            <div v-if="state.tag_filter_creating" class="alert alert-info mt-2 mb-0">
                                Filtering is in progress. Please wait...
                            </div>
                        </v-card-text>
                        <v-card-actions>
                            <v-spacer />
                            <v-btn variant="text" :disabled="state.tag_filter_creating" @click="closeTagFilterDialog">Cancel</v-btn>
                            <v-btn
                                color="blue-darken-4"
                                class="text-white"
                                :loading="state.tag_filter_creating"
                                :disabled="state.tag_filter_creating"
                                @click="submitTagFilter"
                            >
                                Create Filter
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-dialog>
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
        show_model_selection: false,
		activeTab: 'services',
		tag_filter_open: false,
		tag_filter_entities: [],
		tag_filter_selected_entities: [],
		tag_filter_match: 'or',
        tag_filter_mode: 'include',
        tag_filter_mode_options: [
            { value: 'include', title: 'Include tags (selected items)' },
            { value: 'exclude', title: 'Exclude tags (negative tags)' },
            { value: 'untagged', title: 'No tags (the rest)' },
        ],
		tag_filter_set_label: '',
		tag_filter_error: '',
		tag_filter_creating: false,
		tag_filter_id: '',
        filter_creating_id: '',
        filter_operation_message: '',
	})

    async function loadTagEntities() {
        const setRid = store.current_node?.id
        if (!setRid) {
            state.tag_filter_entities = []
            return
        }

        const rows = await web.getSetEntities(setRid)
        const flat = []
        for (const item of rows || []) {
            const rawRid = item?.['@rid'] || item?.rid
            if (!rawRid) continue
            const rid = String(rawRid).startsWith('#') ? String(rawRid) : `#${rawRid}`
            const count = Number(item?.count || 0)
            flat.push({
                value: rid,
                title: `${item.label || rid} (${item.type || 'entity'}, ${count})`,
            })
        }
        flat.sort((a, b) => a.title.localeCompare(b.title))
        state.tag_filter_entities = flat
    }

    async function openTagFilterDialog(filter) {
        state.tag_filter_error = ''
        state.tag_filter_id = filter.id
        state.tag_filter_selected_entities = []
        state.tag_filter_match = 'or'
        state.tag_filter_mode = 'include'
        state.tag_filter_set_label = ''
        await loadTagEntities()
        if (!state.tag_filter_entities.length) {
            state.tag_filter_error = 'No tags found in current set.'
        }
        state.tag_filter_open = true
    }

    function closeTagFilterDialog() {
        if (state.tag_filter_creating) return
        state.tag_filter_open = false
        state.tag_filter_error = ''
    }

    async function submitTagFilter() {
        state.tag_filter_error = ''
        state.filter_operation_message = ''
        if (state.tag_filter_mode !== 'untagged' && !state.tag_filter_selected_entities.length) {
            state.tag_filter_error = 'Please select at least one tag.'
            return
        }
        if (!store.current_node?.id) {
            state.tag_filter_error = 'No source Set selected.'
            return
        }

        const payload = {
            selection_mode: state.tag_filter_mode,
            selected_entity_rids: state.tag_filter_selected_entities,
            match: state.tag_filter_match,
        }
        if (state.tag_filter_mode === 'exclude') {
            payload.match = 'or'
        }
        if (state.tag_filter_mode === 'untagged') {
            payload.selected_entity_rids = []
            payload.match = 'or'
        }
        const trimmedLabel = String(state.tag_filter_set_label || '').trim()
        if (trimmedLabel) payload.set_label = trimmedLabel

        state.tag_filter_creating = true
        state.filter_operation_message = 'Filtering is in progress. Please wait...'
        try {
            await web.createFilter(state.tag_filter_id, store.current_node.id, payload)
            state.tag_filter_open = false
            store.crunchers_open = false
            store.reload(null)
        } catch (error) {
            state.tag_filter_error = error?.message || 'Failed to create tag filter set'
            state.filter_operation_message = ''
            console.error(error)
        } finally {
            state.tag_filter_creating = false
            if (!state.tag_filter_error) {
                state.filter_operation_message = ''
            }
        }
    }

    async function loadData() {
        if (!store.current_node?.id) {
            services.result = {}
            state.service_count = 0
            return
        }

        state.service_count = 0
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
                        console.log(param)
                        // convert values object to array of object {value, title} (Vuetify dropdown format)
                        if(service.tasks[task].params_help[param].values && typeof service.tasks[task].params_help[param].values === 'object' && !Array.isArray(service.tasks[task].params_help[param].values)) {
                            console.log('OBJECT')
                            const entries = Object.entries(service.tasks[task].params_help[param].values);
                            service.tasks[task].params_help[param].values = entries.map(([key, value]) => ({value: key, title: value}));
                            console.log(service.tasks[task].params_help[param].values)
                        }
                        console.log(service.tasks[task].params_help[param].values)
                       
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

    async function createFilter(filter) {
        state.error = ''
        state.filter_operation_message = ''
        try {
            if (filter.id === 'mdf-set-filter') {
                await openTagFilterDialog(filter)
                return
            }
            state.filter_creating_id = filter.id
            state.filter_operation_message = 'Filtering is in progress. Please wait...'
            await web.createFilter(filter.id, store.current_node.id)
            store.crunchers_open = false
            store.reload(null)
        } catch (error) {
            state.error = error?.message || 'Failed to create filter'
            state.filter_operation_message = ''
            console.error(error)
        } finally {
            state.filter_creating_id = ''
            if (!state.error) {
                state.filter_operation_message = ''
            }
        }
    }

    // Handle DSpace query execution
    async function handleDspaceQuery(query) {
        console.log('DSpace query executed:', query)
        const service = 'md-dspace7'
        const task = 'make_query'
        const params = {query: query.solrQuery, scope: query.params.scope, sort: query.params.sort, page: query.params.page, size: query.params.size}
        const task_object = {service: service, id: task, params: params}
        await web.createSourceProcess(task_object, store.current().id)
    }


    onMounted(async()=> {
        if (store.crunchers_open && store.current_node?.id) {
            await loadData()
        }
    })

    watch(
        () => store.crunchers_open,
        async (open) => {
            if (open) {
                await loadData()
            }
        }
    )

    watch(
        () => [store.current_node?.id, store.cruncher_filter],
        async () => {
            if (store.crunchers_open) {
                await loadData()
            }
        }
    )

    const allTasks = computed(() => {
        if(!services.result || !services.result.for_format) return []
        const items = []
        for(const service of services.result.for_format) {
            if(service.id === 'thumbnailer') continue
            const taskEntries = Object.entries(service.tasks || {})
            for(const [taskKey, task] of taskEntries) {
                items.push({ service, serviceId: service.id, serviceName: service.name, taskKey, task })
            }
        }
        return items.sort((a, b) => a.task.name.localeCompare(b.task.name))
    })

    const filtersList = computed(() => {
        if(!services.result || !Array.isArray(services.result.filters)) return []
        return services.result.filters
    })

</script>
