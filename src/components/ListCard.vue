<style>
    .header-title {
        width:200px;
    }
</style>

<template>
    <div>

		<div class="card h-100 w-100 position-absolute">
			<div class="card-header">

			
                <div @click="state.project_creator_open = true" title="lisää node" type="button" class="btn btn-primary float-end">
                    <i title="Add Project" class="bi bi-plus-circle pointer" style="font-size: 1rem; color: white;"></i>
                </div>
                <h4 class="header-title">{{$t('nav.projects')}}</h4>




			</div>

            <div class="card-body">
                <ol class="">
                    <li v-for="item in state.items">
                        <router-link   :to="`/graph?node=${item['@rid'].replace('#','')}`" >{{item.label}}</router-link> 
                    </li>
                </ol>
            </div>
		</div>

        <div v-if="state.project_creator_open" class="modal modal-lg fade show" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true" style="display:block">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        {{ $t('edit.project_create')}}
                    </div>

                    <div class="modal-body">
                        <form>
                            <div class="form-group">
                                <label for="projectTitle">{{$t('edit.project_label')}}</label>
                                <input v-model="state.project_label" class="form-control" id="projectTitle" aria-describedby="projectHelp">
                                <small id="projectHelp" class="form-text text-muted">Descriptive project title helps you to find your stuff.</small>
                            </div>
                        </form>
                    </div>


                    <div class="modal-footer">
                        <button @click="state.project_creator_open = false" type="button" class="btn btn-secondary" >{{$t('edit.cancel')}}</button>
                        <button  @click=createProject() type="button" class="btn btn-primary">{{$t('edit.create')}}</button>
                        <div v-if="state.error" class="alert alert-danger">{{state.error}}</div>
                    </div>
                </div>
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
        project_creator_open: false,
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
         state.project_creator_open = false
    }

    onMounted(async()=> {
        loadData()
    })


</script>
