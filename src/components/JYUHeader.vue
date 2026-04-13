<script setup>
    import { onMounted, reactive, ref, computed, watch } from "vue";
    import { useRoute, useRouter } from 'vue-router'
    import mdLogo from '../assets/images/md-logo.svg'

 
    import RootNodes from './RootNodes.vue'
    import ProjectNodes from './ProjectNodes.vue'
    import {store} from "./Store.js";
    import web from "../web.js";

    const route  = useRoute();
    const router = useRouter();
    const props = defineProps({
        mode: '',
        activeView: { type: String, default: 'graph' },
        projectRid: { type: String, default: null }
    })

    const state = reactive({
      drawer:false, 
      node: '',
    })
    const upload = ref(null);

    const emit = defineEmits(['fit-to-node', 'create-project', 'change-view'])

    const pdfAlertVisible = ref(true);

    // Map active view to tab index for v-tabs highlight
    const tabIndex = computed(() => {
      if (props.activeView === 'search') return 1
      if (props.activeView === 'entities') return 2
      return 0
    })

    function fitToNode(id) {
        console.log(id)
        state.node = id
        emit('fit-to-node', id)
    }

    function createSource(type) {
      store.source_creator_type = type
      store.source_creator_open = true
      state.drawer = false
    }

    function onTabChange(index) {
      if (!props.projectRid) return
      const rid = props.projectRid
      if (index === 0) {
        router.push({ name: 'project-graph', params: { rid } })
      } else if (index === 1) {
        router.push({ name: 'project-search', params: { rid } })
      } else if (index === 2) {
        router.push({ name: 'project-entities', params: { rid } })
      }
    }

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
  
          <template v-slot:prepend>
            <v-app-bar-nav-icon @click.stop="state.drawer = !state.drawer"></v-app-bar-nav-icon>
          </template>
  
          <v-app-bar-title title="projects">
            <RouterLink to="/">MessyDesk</RouterLink>
          </v-app-bar-title> 

          <img :src="mdLogo" alt="MessyDesk logo" class="md-logo" />

          <template v-if="store.current_project && store.current_project.data">
            {{ store.current_project.data.label }}
          </template>
          <template v-else>
            All Your Wonderful Stuff  
          </template>
  
          <v-spacer></v-spacer>
          
          
          
          <v-tabs :model-value="tabIndex" @update:model-value="onTabChange" >
            
            <v-tab >Desk</v-tab>
            <v-tab>Search</v-tab>
            <v-tab>Tags</v-tab>
            
          </v-tabs>

          <!-- <template v-if="store.user && store.user.access == 'admin'">
            <v-spacer></v-spacer>
            <v-alert type="warning">{{ store.user.id }}</v-alert>  
          </template> -->

          <!-- <v-btn icon v-if="store.current_project">
          <router-link :to="'/'"><v-icon>mdi-graph</v-icon>
            <v-tooltip activator="parent" location="top">graph</v-tooltip>
          </router-link>
        </v-btn> -->
          
        <!-- <v-btn icon>
          <router-link :to="'/search'"><v-icon>mdi-magnify</v-icon>
            <v-tooltip activator="parent" location="top">search</v-tooltip>
          </router-link>
        </v-btn>


        <v-btn icon>
          <router-link :to="'/tags'"><v-icon>mdi-tag</v-icon>
            <v-tooltip activator="parent" location="top">tags</v-tooltip>
          </router-link>
        </v-btn> -->
  
          <!-- <v-btn icon>
            <v-icon @click="store.search_open= !store.search_open">mdi-magnify</v-icon>
          </v-btn>
           -->

          <!-- <v-btn icon>
            <router-link :to="'/entities'" ><v-icon>mdi-account-group-outline</v-icon>
              <v-tooltip activator="parent" location="top">entity management</v-tooltip>
            </router-link>
          </v-btn> -->

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
                <router-link :to="'/prompts'"  class="dropdown-item">
                      <i class="fs-5 bi-book"></i><span class="ms-1 d-none d-sm-inline">Prompts</span>
                </router-link>
              </v-list-item>

              <v-list-item>
                <a href="/Shibboleth.sso/Logout"  class="dropdown-item">
                      <i class="fs-5 bi-person"></i><span class="ms-1 d-none d-sm-inline">Logout</span>
                </a>
              </v-list-item>

            </v-list>
          </v-menu>
          
    </v-app-bar>

    <!-- <v-alert
      v-model="pdfAlertVisible"
      type="warning"
      dismissible
      class="pdf-alert"
      style="position: absolute; left: 50%; top: 10px; transform: translateX(-50%); z-index: 9999; min-width: 320px; max-width: 90vw;"
    >
      PDF processing is down currently.
    </v-alert> -->

    <!-- Sidebar -->
    <v-navigation-drawer
        v-model="state.drawer"
        width="375"
        :location="$vuetify.display.mobile ? 'bottom' : undefined"
        temporary
      >
   
      <v-list lines="two">
        <v-list-subheader><router-link :to="'/'" >Back to Main</router-link></v-list-subheader>

        <v-list-item v-if="props.mode=='graph'"
          @click="store.uploader_open = true"
        >
          <template v-slot:prepend>
            <v-icon  icon="mdi-file-plus"></v-icon>
          </template>
      
            <v-list-item-title >Add file</v-list-item-title>
        </v-list-item>





         <v-list-group value="Actions" v-if="props.mode=='graph'">
          <template v-slot:activator="{ props }">
            <v-list-item
              v-bind="props"
              title="Add source"
            >
            <template v-slot:prepend>
            <v-icon  icon="mdi-folder-plus"></v-icon>
          </template>
          </v-list-item>
          </template>

            <v-list-item @click="createSource('nextcloud')">Nextcloud
              <template v-slot:prepend>
              <v-icon  icon="mdi-cloud-arrow-down"></v-icon>
            </template>
            </v-list-item>

            <v-list-item @click="createSource('dspace7')">Dspace7
              <template v-slot:prepend>
              <v-icon  icon="mdi-cloud-arrow-down"></v-icon>
            </template>
            </v-list-item>
          
        </v-list-group> 

         <v-list-item v-if="props.mode=='graph' && store.user && store.user.access == 'admin'"
          @click="store.set_creator_open = true"
        >
          <template v-slot:prepend>
            <v-icon  icon="mdi-folder-plus"></v-icon>
          </template>
      
            <v-list-item-title >Create set</v-list-item-title>
        </v-list-item> 



        <v-divider inset></v-divider>

      </v-list>

        <RootNodes v-if="props.mode=='graph'" @fit-to-node="fitToNode" />
        <ProjectNodes v-if="props.mode=='projects'" @fit-to-node="fitToNode" />

    </v-navigation-drawer>




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