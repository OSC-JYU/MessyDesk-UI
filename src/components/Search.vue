
<script setup>
    import { useRouter } from 'vue-router'
    import web from "../web.js";
    import { store } from "./Store.js";
    import { reactive } from "vue"

    var state = reactive({term: '', result: []})
    const router = useRouter();

    async function search() {
        state.result = await web.search(state.term)
    }
    function go(rid, index) {
        const searchResults = state.result.map((doc, i) => ({
          rid: doc.id,
          label: doc.label,
          score: doc.score,
          highlight: ''
        }))

        store.file_browse_context = {
          mode: 'search',
          query: state.term,
          results: searchResults,
          index: typeof index === 'number' ? index : 0
        }

        state.term = ''
        state.result = []
        router.push({ name: 'project-graph', params: { rid: rid.replace('#', '') } })
    }
</script>


<template>
    <div class="d-flex">
        <input v-model = "state.term" @keyup.enter="search()" class="form-control me-2" type="search" placeholder="Search" aria-label="Search" >
        <ul class="list-group" style="position:absolute; margin-top:40px; z-index:1001">
            <li v-for="(result, index) in state.result" :key="result.id" class="list-group-item">
                <div @click="go(result.id, index)">{{result.label}} ({{result.type}})</div>
            </li>
        </ul>
    </div>
</template>
