<style scoped>
    .enabled {
        background-color: greenyellow;
        color: black;
    }
    .disabled {
        background-color: pink;
        color: black;
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
                    <div class="row m-0 p-0 mt-5 flex-grow-1">
                   
                        <h3>Services For Images</h3>
                        <div v-for="service in state.services.image">
                      
                            <div>
                                <b>{{ service.id }}</b> {{ service.url }} 
                                <span v-if="service.online" class="badge enabled">online</span>
                                <span v-else class="badge disabled">offline</span>
                                <span v-if="service.enabled" class="badge enabled">enabled</span>
                                <span v-else class="badge disabled">disabled</span>
                            </div>

                            <div>
                                <ul class="list-group">
                                    <li class="list-group-item list-group-item-primary" v-for="s in service.tasks">
                                        {{ s.name }} 
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <h3>Services For PDF</h3>
                        <div v-for="service in state.services.pdf">
                      
                            <div>
                                <b>{{ service.id }}</b> {{ service.url }}
                                <span v-if="service.online" class="badge enabled">online</span>
                                <span v-else class="badge disabled">offline</span>
                                <span v-if="service.enabled" class="badge enabled">enabled</span>
                                <span v-else class="badge disabled">disabled</span>
                            </div>

                            <div>
                                <ul class="list-group">
                                    <div  class="list-group-item list-group-item-primary" v-for="s in service.tasks">
                                        {{ s.name }}
                                    </div>
                                </ul>

                            </div>
                        </div>

                        <h3>Services For text</h3>
                        <div  v-for="service in state.services.text">
                      
                            <div>
                                <b>{{ service.id }}</b> {{ service.url }}
                                <span v-if="service.online" class="badge enabled">online</span>
                                <span v-else class="badge disabled">offline</span>
                                <span v-if="service.enabled" class="badge enabled">enabled</span>
                                <span v-else class="badge disabled">disabled</span>
                            </div>

                            <div>
                                <ul class="list-group">
                                    <div  class="list-group-item list-group-item-primary" v-for="s in service.tasks">
                                        {{ s.name }}
                                    </div>
                                </ul>
                            </div>
                        </div>

                    
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
