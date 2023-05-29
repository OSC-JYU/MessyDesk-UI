
<template>
    <div>
		<div class="card">
			<div class="card-header bg-primary text-white">
				<div>Kartta</div>
				<h4>Sijainti</h4>
			</div>
			<div class="card-body">
                <div class="alert alert-info">
                    Raahaa itsesi oikeaan kohtaan kartalla ja klikkaa OK.
                </div>
                <div class="mt-2">Karttaa voi raahata hiirellä ja zoomata hiiren rullalla.</div>

                <div class="btn-group float-end mt-4" role="group" aria-label="Basic example">

                    <button @click="router.go(-1)" type="button" class="btn btn-secondary">peru</button>
                    <button @click="setMapPosition()" type="button" class="btn btn-primary">OK</button>
                </div>
            </div>
        </div>
    </div>
</template>


<script setup>
    import { onMounted, watch, reactive, ref, computed } from "vue";
    import { useRouter, useRoute } from 'vue-router'
    import {store} from "./Store.js";
    import web from "../web.js";

    const router = useRouter();
    const route = useRoute();

    var state = reactive({node: {}})

    async function setMapPosition() {
        //await web.connect(route.query.node, relation.type, to)
        if(route.query.relation) {
            await web.setRelationAttribute(route.query.relation, {name:'x', value: store.x})
            await web.setRelationAttribute(route.query.relation, {name:'y', value: store.y})
            router.go(-1)
        }
    }

</script>
