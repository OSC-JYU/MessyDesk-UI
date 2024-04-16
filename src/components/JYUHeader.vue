<script setup>
    import { onMounted } from "vue";
    import { useRoute } from 'vue-router'
    import Search from './Search.vue'
    import Importer from './Importer.vue'
    import Exporter from './Exporter.vue'
    import {store} from "./Store.js";
    import web from "../web.js";

    const route  = useRoute();
    const props = defineProps({
        mode: ''
    })

</script>

<template>



<nav class="navbar navbar-expand-lg ">
  <div class="container-fluid">
      <img class="mr-3" src="@/assets/images/logo.svg" height="40px">
      <a class="navbar-brand" href="/">MessyDesk</a><span v-if="store.current()">{{ store.current().data.name }}</span><div class="badge bg-danger" v-if="store.user && store.user.mode == 'development'" title="KuKaKo is running on developer mode!">LOCAL</div>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarSupportedContent">
      <ul class="navbar-nav me-auto mb-2 mb-lg-0">






      </ul>

        <!-- <Search /> -->

        <div class="btn-group">
          <button type="button" class="btn navbar dropdown-toggle" data-bs-toggle="dropdown" data-bs-display="static" aria-expanded="false" style="margin-left:50px; padding:15px">
            Menu
          </button>
          <ul class="dropdown-menu dropdown-menu-start dropdown-menu-lg-start">


              <li class="nav-item">
                  <router-link :to="'/services'" class="dropdown-item">
                      <i class="fs-5 bi-card-list"></i><span class="ms-1 d-none d-sm-inline">Services</span>
                  </router-link>
              </li>


              <li v-if="store.user && store.user.access == 'admin'" class="nav-item">
                  <router-link :to="'queries'" class="dropdown-item">
                      <i class="fs-5 bi-question"></i><span class="ms-1 d-none d-sm-inline">Navigation</span>
                  </router-link>
              </li>


          </ul>
        </div>

        <div class="btn-group">
          <button v-if="route.query.node" type="button" class="btn navbar " data-bs-toggle="dropdown" data-bs-display="static" aria-expanded="false" style="margin-left:50px; padding:15px">
                        
            <div @click="store.uploader_open = true" class="dropdown-item">
                      <i class="fs-5 bi-plus-circle"></i><span class="ms-1 d-none d-sm-inline">Add File</span> </div>
             
          </button>

        </div>

    </div>
  </div>
</nav>

<Importer />
<Exporter />

</template>

<style scoped>

a.navbar-brand {
  color:white;
}

a.dropdown-item {
  color: black
}

a.nav-link {
  color: white;
}

.header  {
  color: white;
  text-decoration: none;
}

.navbar {
  width: 100%;
  background-color: #002957;
  display: flex;
  align-items: center;
  color: white;
}

header a {
  color: white;
  text-decoration: none;

}

img {
  height: 50px;
  width: auto;
  margin: 1em 1em 1em 2em;
}

</style>
