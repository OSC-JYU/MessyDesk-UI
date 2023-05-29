

<template>
    <div>
        <JYUHeader/>
        <ol>
        <li v-for="repo of state.repos.data" :key="repo.id">
            {{repo.name}}
        </li>
    </ol>
    </div>
</template>

<script setup>
    import JYUHeader from './JYUHeader.vue'
    import { reactive, onMounted } from 'vue'
    import web from '../web.js'

    var state = reactive({repos: []})

    onMounted(async()=>{
        state.repos = await web.getGitlabRepos()
    })
</script>
