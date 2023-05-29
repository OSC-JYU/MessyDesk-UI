
<template>
    <div>

		<div class="card">
			<div class="card-header">
				<div>KuKaKo</div>

				<h4>Statistics</h4>
			</div>
			<div class="card-body">
                <div v-for="item in state.items">
                    {{item.labels}} : {{item.count}}
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
        items: []
    })

    onMounted(async()=> {
        var response = await web.getStats()
        state.items = response.result

    })


</script>
