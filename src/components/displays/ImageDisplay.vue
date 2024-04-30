<template>
    <div class="container">
      <div class="col-9 m-2">
        <img v-if="state.file" :src="state.file.thumbnail" alt="Image" />
      </div>
      <div class="col-3">
        <template v-if="state.file">
            <div class="card m-2">
                <div class="card-header"><h2>{{ state.file.label }}</h2></div>
                <p>{{ state.file.path }}</p>
            </div>

        </template>
      </div>
    </div>
  </template>
  
  <script setup>

    import { onMounted, watch, reactive, ref, computed } from "vue";
    import { useRouter, useRoute } from 'vue-router'
  
    import web from "../../web.js";

    const route = useRoute();

    var state = reactive({
        file: null
    })

    onMounted(async()=> {

        var response = await web.getDocInfo(route.params.rid)
        
        state.file = response
        state.file.thumbnail = removeLastPathPart(response.path.replace('data/', '/api/thumbnails/'))
    })

    function removeLastPathPart(str) {
        const lastIndex = str.lastIndexOf('/');
        if (lastIndex !== -1) {
            return str.substring(0, lastIndex);
        }
        return str;
    }

  </script>
  
  <style scoped>
  .container {
    display: flex;
  }
  
  .column {
    flex: 1;
  }
  
  .column img {
    max-width: 100%;
    height: auto;
  }
  </style>