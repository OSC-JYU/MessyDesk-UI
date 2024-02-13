
<template>
    <div>

		<div class="card">
			<div class="card-header">
				<div>MessyDesk</div>

				<h4>Projects</h4>
			</div>

            <button @click="state.creator_open = !state.creator_open">Add project</button>
            <div v-if="state.creator_open">
                <div class="input-group-text" id="inputGroup-sizing-default">Project title</div>
                <div class="input-group mb-3">
                    <input v-model="state.project_name" type="text" class="form-control" aria-label="Project name" aria-describedby="inputGroup-sizing-default">
                </div>
                <button @click="create()" class="btn btn-primary">Create</button>
                {{ state.error }}

            </div>
			<div class="card-body">
                <div v-for="item of state.items">
                    <router-link   :to="`/graph?node=${item['@rid'].replace('#','')}`" >{{item.label}}</router-link> 
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
        error: ''
    })

    async function create() {
        if(state.project_name == '') {
            state.error = 'Give project name!'
        } else {
            state.error = ''
            await web.createProject(state.project_name)
            state.creator_open = false
            store.reload()
        }
        
    }

    onMounted(async()=> {
        var response = await web.getProjects()
        state.items = response

    })


</script>
