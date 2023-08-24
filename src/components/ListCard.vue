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
			<div class="card-body overflow-auto">
                <ol class="">
                    <li v-for="item in state.items">
                        <router-link   :to="`/list/Project/${item['@rid'].replace('#','')}`" >{{item.label}}</router-link> 
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
                                <label for="exampleInputEmail1">{{$t('edit.project_title')}}</label>
                                <input type="email" class="form-control" id="projectTitle" aria-describedby="emailHelp" :placeholder="$t('edit.project_title')">
                                <small id="emailHelp" class="form-text text-muted">Descriptive project title helps you to find your stuff.</small>
                            </div>
                        </form>
                    </div>


                    <div class="modal-footer">
                        <button @click="close()" type="button" class="btn btn-secondary" >{{$t('edit.cancel')}}</button>
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
        error: '',
        items: [],
        project_creator_open: false,
        project_title: ''
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

    function close() {
        state.project_creator_open = false
    }

    async function createProject() {

    }

    onMounted(async()=> {
        loadData()

    })


</script>
