
<template>
    <div>

		<div class="card h-100 w-100 position-absolute">
			<div class="card-header">

				<h4>Projects</h4>
			</div>
			<div class="card-body overflow-auto">
                <ol class="">
                    <li v-for="item in state.items">
                        <router-link   :to="`/list/Project/${item['@rid'].replace('#','')}`" >{{item.label}}</router-link> 
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
        items: []
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

    onMounted(async()=> {
        loadData()

    })


</script>
