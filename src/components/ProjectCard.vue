
<template>
    <div>

		<div class="card">
			<div class="card-header">
				<div>MessyDesk</div>
                <div class="d-flex justify-content-between ">
                    <h4 class="">Desks</h4>
                    <div class="float-end pointer">
                        <i  title="Create new Desk" @click="state.creator_open = !state.creator_open" class=" bi bi-plus-circle-fill" style="font-size: 1.2rem; color: #002957;"></i>
                    </div>
                </div>
			</div>

            <!-- Desk Creator open-->
            <div class="card m-2" v-if="state.creator_open">
 
                <div class="card-header">Create new desk</div>
                <div class="input-group mb-3">
                    <input v-model="state.project_name" type="text" class="form-control" aria-label="Desk name" aria-describedby="inputGroup-sizing-default" placeholder="Project title">
                </div>
                <button @click="create()" class="btn btn-primary">Create</button>

                <div v-if="state.error" class="alert alert-warning"> {{ state.error }}</div>

            </div>

            <!-- Desk Creator closed-->
            <div v-else>       
                 
                <!-- Desk node selected-->
                <div v-if="store.current_node && state.project">
                    <!-- <h3>{{ state.project[0].label }}</h3>
                    <div>{{ state.project[0].description }}</div> -->
                    <button class="btn">
                        <router-link   :to="`/graph?node=${store.current_node.id.replace('#','')}`" >open</router-link>
                    </button>
                </div>

                <!-- Desk node not selected-->
                <div v-if="!store.current_node" class="card-body">
                    <v-list>
                        <v-list-item
                            v-for="item in state.items"
                            :key="item.id"
                            :subtitle="item.file_count + ' files'"
                            :title="item.label"
                            :to="`/graph?node=${item['@rid'].replace('#','')}`"
                        >
                            <template v-slot:prepend>
                                <v-avatar color="grey-lighten-1">
                                    <v-icon color="white">mdi-desk</v-icon>
                                </v-avatar>
                            </template> 
                            <template v-slot:append>
                            <v-btn
                                color="grey-lighten-1"
                                icon="mdi-information"
                                variant="text"
                                :to="`/graph?`"
                            ></v-btn>
                            </template>
                            
                        </v-list-item>
                    </v-list>

                </div>
            </div>
            
		</div>

    </div>
</template>


<script setup>
    import { onMounted, watch, reactive, ref, computed } from "vue";
    import {store} from "./Store.js";
    import web from "../web.js";

    var state = reactive({
        items: [],
        creator_open: false,
        project_name: '',
        error: '',
        project: null

    })

    watch(
        () => store.current_node,
        async (newValue, oldValue) => {
            if(newValue)
                await getProjectData()
            else    
                state.project = null
    })

    async function create() {
        if(state.project_name == '') {
            state.error = 'Give project name!'
        } else {
            state.error = ''
            await web.createProject(state.project_name)
            state.creator_open = false
            var response = await web.getProjects()
            state.items = response
            store.reload()
        }
    }


    async function getProjectData() {
        if(store.current_node)
            state.project = await web.getProject(store.current_node.id)

    }

    onMounted(async()=> {
        var response = await web.getProjects()
        store.current_node = null
        state.items = response
    })


</script>
