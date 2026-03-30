<script setup>
    import { onMounted, reactive, ref, watch } from "vue";
    import { useRoute } from 'vue-router'
    import mdLogo from '../assets/images/md-logo.svg'

    import RootNodes from './RootNodes.vue'
    import ProjectNodes from './ProjectNodes.vue'
    import {store} from "./Store.js";

    const route  = useRoute();
    const props = defineProps({
        mode: ''
    })

    const state = reactive({
      drawer:false, 
      node: '',
      tab: 0
    })
    const upload = ref(null);

    const emit = defineEmits(['fit-to-node', 'create-project', 'change-tab'])

    function fitToNode(id) {
        console.log(id)
        state.node = id
        emit('fit-to-node', id)
    }

    function changeTab(tab) {
        emit('change-tab', tab)
    }

    // watch state.tab
    watch(() => state.tab, async (newValue, oldValue) => {
        console.log(newValue)
        emit('change-tab', newValue)
    })

</script>

<template>

  <v-app-bar
          color="teal-darken-4"
         
        >
          <template v-slot:image>
            <v-img
              gradient="to top right, rgba(19,84,122,.8), rgba(128,208,199,.8)"
            ></v-img>
          </template>

          <img :src="mdLogo" alt="MessyDesk logo" class="md-logo" />  

          <v-app-bar-title title="projects">
            <span @click="changeTab(0)">MessyDesk</span>
          </v-app-bar-title> 


  
          <v-spacer></v-spacer>

          <v-tabs v-model="state.tab" >

            <v-tab >Main</v-tab>
            <v-tab>Search</v-tab>
            <v-tab>Tags</v-tab>

          </v-tabs>



          <v-menu location="bottom">
            <template v-slot:activator="{ props }">

              <v-btn icon  v-bind="props">
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>

            </template>

            <v-list>

              <v-list-item v-if="store.user && store.user.access == 'admin'">
                <router-link :to="'/services'" class="dropdown-item">
                      <i class="fs-5 bi-card-list"></i><span class="ms-1 d-none d-sm-inline">Services</span>
                  </router-link>
              </v-list-item>

              <v-list-item v-if="store.user && store.user.access == 'admin'">
                <router-link :to="'/admin'" class="dropdown-item">
                      <i class="fs-5 bi-person-fill"></i><span class="ms-1 d-none d-sm-inline">Admin</span>
                  </router-link>
              </v-list-item>

              <v-list-item>
                <a href="/prompts"  class="dropdown-item">
                      <i class="fs-5 bi-book"></i><span class="ms-1 d-none d-sm-inline">Prompts</span>
                </a>
              </v-list-item>

              <v-list-item>
                <a href="/Shibboleth.sso/Logout" class="dropdown-item">
                      <i class="fs-5 bi-person"></i><span class="ms-1 d-none d-sm-inline">Logout</span>
                </a>
              </v-list-item>
            </v-list>
          </v-menu>
          
    </v-app-bar>






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

.md-logo {
  height: 50px;
  width: auto;
  margin: 0.4em 1em 0.4em 0.6em;
}

</style>