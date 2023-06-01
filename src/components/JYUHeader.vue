<script setup>
import { onMounted} from "vue";
    import Search from './Search.vue'
    import Importer from './Importer.vue'
    import Exporter from './Exporter.vue'
    import {store} from "./Store.js";
    import web from "../web.js";

    const props = defineProps({
        mode: ''
    })
    onMounted(async()=>{
        store.menus = await web.getMenus()
        //store.groups = await web.getGroups()
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


      <!-- ME -->
          <!-- <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              Minä
            </a>
            <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
                <router-link  to="/graph?node=me" class="dropdown-item">omat linkit</router-link>
                <li><hr class="dropdown-divider"></li>
              <li v-for="item in store.queries" :key="item['@rid']" >

                <router-link v-if="item.menu == 'me'" :to="`/graph?query=${item['@rid'].replace('#','')}`" class="dropdown-item">{{item.label}}</router-link>
              </li>
            </ul>
          </li> -->

          <!-- <li v-if="store.menus.length == 0">
              No menus defined
          </li>
          <li v-for="menu in store.menus" :key:="menu.label" class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                {{menu.label}}
              </a>
              <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
                  <template v-if="menu.id == 'me'">
                      <router-link   to="/graph?node=me" class="dropdown-item">My connections</router-link>
                      <li><hr class="dropdown-divider"></li>
                  </template>
                <li v-for="item in menu.items" :key="item['@rid']" >
                    <template v-if="item['@type'] == 'Query'">
                        <router-link :to="`/graph?query=${item['@rid'].replace('#','')}`" class="dropdown-item">{{item.label}}</router-link>
                    </template>
                </li>
              </ul>
          </li> -->

          <!-- TAGS -->
          <li v-if="store.tags.length > 0" class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Roolit
              </a>
              <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
                  <li v-for="tag in store.tags" :key="tag['@rid']" >
                    <router-link :to="`/graph?tag=${tag['@rid'].replace('#','')}`" class="dropdown-item">{{tag.label}}</router-link>
                  </li>
              </ul>
          </li>


          <!-- LISTS -->
          <li v-if="store.tags.length > 0" class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Listat
              </a>
              <ul class="dropdown-menu" aria-labelledby="navbarDropdown">

                  <li v-for="schema in store.schemas" :key="schema.type" >
                    <router-link :to="`/list/${schema.type}`" class="dropdown-item">{{schema.label}}</router-link>
                  </li>
              </ul>
          </li>


      </ul>

      <div @click="initNodeCreator(relation)" title="lisää node" type="button" class="btn btn-primary float-end">
              Add File
        </div>


        <!-- <Search /> -->


        <div class="btn-group">
          <button type="button" class="btn navbar dropdown-toggle" data-bs-toggle="dropdown" data-bs-display="static" aria-expanded="false" style="margin-left:50px; padding:15px">
            <i class="fs-5 bi-gear"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-start dropdown-menu-lg-start">
              <li v-if="store.user && store.user.access != 'user'">
                  <div @click="store.node_creator_open = true" class="dropdown-item">
                      <i class="fs-5 bi-plus-circle"></i><span class="ms-1 d-none d-sm-inline">Add Node</span> </div>
              </li>

              <li class="nav-item">
                  <router-link :to="'/stats'" class="dropdown-item">
                      <i class="fs-5 bi-card-list"></i><span class="ms-1 d-none d-sm-inline">Stats</span>
                  </router-link>
              </li>


              <li v-if="store.user && store.user.access == 'admin'" class="nav-item">
                  <router-link :to="'queries'" class="dropdown-item">
                      <i class="fs-5 bi-question"></i><span class="ms-1 d-none d-sm-inline">Navigation</span>
                  </router-link>
              </li>


              <li class="nav-item">
                  <router-link :to="'/about'" class="dropdown-item">
                      <i class="fs-5 bi-info-circle"></i><span  class="ms-1 d-none d-sm-inline">About</span>
                  </router-link>
              </li>

              <template v-if="store.user && store.user.mode == 'development'">
                  <li><hr class="dropdown-divider"></li>
                  <li class="dropdown-item" @click="store.importer_open = 'graph'">Import Graph</li>
                  <li class="dropdown-item" @click="store.exporter_open = 'graph'">Export Graph</li>
                  <li><hr class="dropdown-divider"></li>
                  <li class="dropdown-item" @click="store.importer_open = 'styles'">Import Style</li>
                  <li class="dropdown-item" @click="store.exporter_open = 'styles'">Export Style</li>
              </template>


          </ul>
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
