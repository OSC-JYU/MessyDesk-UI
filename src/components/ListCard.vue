
<template>
    <div>

		<div class="card h-100 w-100 position-absolute">
			<div class="card-header">
                <h4>Projects</h4>
			</div>
            
			<div class="card-body overflow-auto">

                <div @click="initNodeCreator(relation)" title="lisää node" type="button" class="btn btn-primary float-end">
                    <i title="Add Project" class="float-end bi bi-plus-circle pointer" style="font-size: 1rem; color: white;"></i>
                </div>

                <form>
                    <div class="form-group">
                        <label for="exampleInputEmail1">Project name</label>
                        <input type="text" class="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" placeholder="Project name" v-model="state.project_label">
                        <small id="emailHelp" class="form-text text-muted">Use descriptive name</small>
                    </div>

                    <button type="button" @click="createProject()" class="btn btn-primary">Create Project</button>
                </form>


                <ol class="">
                    <li v-for="item in state.items">
                        <router-link   :to="`/graph?node=${item['@rid'].replace('#','')}`" >{{item.label}}</router-link> 
                    </li>
                </ol>
			</div>
		</div>



    </div>
</template>


<script setup>
    import { onMounted, watch, reactive} from "vue";
    import {store} from "./Store.js";
    import web from "../web.js";
    import { useRoute } from 'vue-router'

    const route  = useRoute();

    var state = reactive({
        items: [],
        project_label: '',
        project_description: ''
    })

    watch(
        () => route.params,
        async (newValue, oldValue) => {
            loadData(newValue)
    })

    async function loadData() {
        var response = await web.getProjects()
        console.log(response)
        state.items = response
    }

    async function createProject() {
        await web.createProject(state.project_label, state.project_description)
    }

    onMounted(async()=> {
        loadData()

    })


</script>
