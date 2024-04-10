<style scoped>
    .enabled {
        background-color: greenyellow;
        color: black;
        margin:2px;
    }
    .disabled {
        background-color: pink;
        color: black;
        margin:2px;
    }
    .has {
        background-color: rgb(163, 166, 237);
        color: black;
        margin:2px;
    }
</style>

<script setup>
    import { onMounted, reactive } from "vue";
    import JYUHeader from './JYUHeader.vue'
    import web from "../web.js";


    var state = reactive({
        services: []
    })

    document.title = "MessyDesk - services"

    async function enable(adapter_ID) {
        console.log(adapter_ID)
    }

    onMounted(async()=> {
        var response = await web.getServices()
        var data = {'text':[], 'pdf':[], 'image':[]}
        for(var s in response) {
            console.log(response[s]['supported_types'])
            for(var mediatype of response[s]['supported_types']) {
                data[mediatype].push(response[s])
            }
        }
        state.services = data
    })

</script>



<template>
    <div class="vh-100 container-fluid m-0 p-0">
        <div class="row  h-100  w-100 m-0 p-0">
            <div class="col-12 m-0 p-0">
                <div class="h-100 d-flex flex-column w-100 m-0 p-0">
                    <div class="row justify-content-center m-0 p-0">
                        <JYUHeader/>
                    </div>
                    <div class="m-2">
                        <h4 class="mt-5">Services For Images</h4>
                        <div class="row m-0 p-0 mt-0 flex-grow-1 ">
                    
                            <div class="card bg-light p-2 m-2" style="width: 18rem;" v-for="service in state.services.image">
                        
                            
                                    <div class="card-header">

                                        <b>{{ service.id }}</b> 
                                        <span v-if="service.nomad_hcl" title="service has .hcl file" class="badge has">hcl</span>
                                        <span v-else class="badge disabled">static</span>
                                        {{ service.url }}
                                        <div>
                                            <span v-if="service.consumers.length" class="badge          enabled">online {{ service.consumers.length }}</span>
                                            <span v-else class="badge disabled">offline</span>

                                            <span v-if="service.disabled" class="badge disabled">disabled</span>

                                            <span v-if="service.nomad" class="badge enabled">nomad</span>
   
                                        </div>
  
                                    </div>

                                    
                                    <div class="card-body">
                                       
                                        <p class="d-inline-flex gap-1">

                                            <button class="btn btn-primary" type="button" data-bs-toggle="collapse" :data-bs-target="'#'+service.id" aria-expanded="false" aria-controls="collapseExample">
                                                Tasks
                                            </button>
                                        </p>
                                        <div class="collapse" :id="service.id">
                                            <ul class="list-group">
                                                <div  class="list-group-item " v-for="s in service.tasks">
                                                <b>{{ s.name }}</b>
                                                <p>{{ s.description }}</p>
                                                </div>
                                            </ul>
                                        </div>
                                    </div>
                                
                            </div>
                        </div>

                        <h4 class="mt-5">Services For PDF</h4>
                        <div class="row m-0 p-0 mt-0 flex-grow-1 ">
                            <div class="card bg-light p-2 m-2" style="width: 18rem;" v-for="service in state.services.pdf">
                        
                                <div class="card">
                                    <div class="card-header">

                                        <b>{{ service.id }}</b> 
                                        <span v-if="service.nomad_hcl" title="service has .hcl file" class="badge has">hcl</span>
                                        <span v-else class="badge disabled">static</span>
                                        {{ service.url }}

                                        <div>
                                            <span v-if="service.consumers.length" class="badge          enabled">online {{ service.consumers.length }}</span>
                                            <span v-else class="badge disabled">offline</span>

                                            <span v-if="service.disabled" class="badge disabled">disabled</span>
                                            <span v-if="service.nomad" class="badge enabled">nomad</span>
                                        </div>                                                        

                                        
   
                                    </div>

                                    
                                    <div class="card-body">
    
                                        <p class="d-inline-flex gap-1">

                                            <button class="btn btn-primary" type="button" data-bs-toggle="collapse" :data-bs-target="'#'+service.id" aria-expanded="false" aria-controls="collapseExample">
                                                Tasks
                                            </button>
                                        </p>
                                        <div class="collapse" :id="service.id">
                                            <ul class="list-group">
                                                 <div  class="list-group-item " v-for="s in service.tasks">
                                                    <b>{{ s.name }}</b>
                                                <p>{{ s.description }}</p>
                                                </div>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h4 class="mt-5">Services For text</h4>
                        <div class="row m-0 p-0 mt-0 flex-grow-1 ">
                            <div class="card bg-light p-2 m-2" style="width: 18rem;" v-for="service in state.services.text">
                        
                                <div class="card">
                                    <div class="card-header">

                                        <b>{{ service.id }}</b> 
                                        <span v-if="service.nomad_hcl" title="service has .hcl file" class="badge has">hcl</span>
                                        <span v-else class="badge disabled">static</span>
                                        {{ service.url }}
                                        
                                        <div>
                                            <span v-if="service.consumers.length" class="badge enabled">online {{ service.consumers.length }}</span>
                                            <span v-else class="badge disabled">offline</span>

                                            <span v-if="service.disabled" class="badge disabled">disabled</span>
                                            <span v-if="service.nomad" class="badge enabled">nomad</span>
                                        </div>
                                    </div>

                                    
                                    <div class="card-body">

                                        <p class="d-inline-flex gap-1">

                                            <button class="btn btn-primary" type="button" data-bs-toggle="collapse" :data-bs-target="'#'+service.id" aria-expanded="false" aria-controls="collapseExample">
                                                Tasks
                                            </button>
                                        </p>
                                        <div class="collapse" :id="service.id">
                                            <ul class="list-group">
                                                <div  class="list-group-item " v-for="s in service.tasks">
                                                    <b>{{ s.name }}</b>
                                                <p>{{ s.description }}</p>
                                                </div>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
