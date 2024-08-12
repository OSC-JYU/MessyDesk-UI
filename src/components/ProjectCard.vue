
<template>
    <div >

		<v-sheet 
        class="pa-6 text-black ">
			<div v-if="store.current_node && state.project" class="card-header">
                <h3 >{{ store.current_node.data.label }}</h3>
			</div>

                    
            <div v-else>


                <h4 class="text-h5 font-weight-bold mb-4">Project view</h4>

                <p class="mb-8">
                Here you you can see your projects and you can arrange them visually.

                <br>
                <br>
                Double click project node to open it.
                <br>
                <br>



                <v-card class="pa-6">TIP: You can quickly find your projects from hamburger menu.</v-card>
                </p>
            </div>
            


            </v-sheet>
    

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
