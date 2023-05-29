<script setup>
    import { onMounted, watch, reactive} from "vue";
    import {store} from "./Store.js";
    import web from "../web.js";
    //var editing = ref(false)

    var state = reactive({queries: [], current: null, groups: []})
    const emit = defineEmits(['setGraphOptions','saveLayout'])


</script>



<template>

            <div class="card">
                <div class="card-header">
                    <div>KuKaKo</div>
                    <h4>Navigation Graph</h4>
                </div>
                <div class="card-body">
                    <p>Navigation of KuKaKo is a special graph with <b>Menus</b>, <b>Queries</b> and <b>User Groups</b>. Browse the graph on the left and you'll figure out it very quickly.</p>

                    <p><b>Queries</b> are the main tool for providing sensible navigation to users. They are written with Open Cypher.</p>

                    <p><b>Menus</b> makes queries accessible to users.</p>

                    <p><b>UserGroups</b>, on the other hand, makes menus visible to users that belong to that UserGroup. Default user group is "User".</p>

                     <p>Relationships between navigation nodes (aka navigation graph) are created just like any other relationship in KuKaKo.</p>

                     <p class="alert alert-info">Double click a node in order to edit it.</p>

                </div>

            <div v-if="store.user && store.user.access == 'admin'" class="card-footer">
                <div class="btn-group" role="group" >
                    <!--<button class="btn" @click="setGraphOptions('cose')">cose</button>-->
                    <button class="btn" title="layout cose" @click="$emit('setGraphOptions', 'cose')">A1</button>
                    <button class="btn" title="layout cola" @click="$emit('setGraphOptions', 'cola')">A2</button>
                    <button class="btn" title="layout fcose" @click="$emit('setGraphOptions', 'fcose')">A3</button>
                    <button class="btn" title="layout grid" @click="$emit('setGraphOptions', 'grid')">grid</button>
                    <button @click="$emit('saveLayout')" class="btn btn-primary" title="talleta asettelu KAIKILLE käyttäjille"> save PUBLIC layout</button>
                </div>


                    <div v-if="store.user">{{store.user.id}} : {{store.user.group}} : {{store.user.access}}</div>
            </div>

            </div>


</template>
