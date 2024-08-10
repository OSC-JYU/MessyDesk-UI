<script setup>
    import { onMounted, reactive, ref } from "vue";
    import { useRoute } from 'vue-router'
    import Search from './Search.vue'
    import Importer from './Importer.vue'
    import Exporter from './Exporter.vue'
    import RootNodes from './RootNodes.vue'
    import {store} from "./Store.js";
    import web from "../web.js";

    const route  = useRoute();
    const props = defineProps({
        mode: ''
    })

    const state = reactive({drawer:false, node: ''})
    const upload = ref(null);

    const emit = defineEmits(['fit-to-node'])

    function fitToNode(id) {
        console.log(id)
        state.node = id
        emit('fit-to-node', id)
    }

</script>

<template>

  <v-app-bar
          color="teal-darken-4"
          image="https://picsum.photos/1920/1080?random"
        >
          <template v-slot:image>
            <v-img
              gradient="to top right, rgba(19,84,122,.8), rgba(128,208,199,.8)"
            ></v-img>
          </template>
  
          <template v-slot:prepend>
            <v-app-bar-nav-icon @click.stop="state.drawer = !state.drawer"></v-app-bar-nav-icon>
          </template>
  
          <v-app-bar-title>
            <RouterLink to="/">MessyDesk</RouterLink>
          </v-app-bar-title>Projektin nimi
  
          <v-spacer></v-spacer>
  
          <v-btn icon>
            <v-icon>mdi-magnify</v-icon>
          </v-btn>
  
          <v-btn icon>
            <v-icon>mdi-heart</v-icon>
          </v-btn>
  
          <v-btn icon>
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
          
    </v-app-bar>

    <v-navigation-drawer
        v-model="state.drawer"
        width="375"
        :location="$vuetify.display.mobile ? 'bottom' : undefined"
        temporary
      >
   
      <v-list lines="two">
      <v-list-subheader>Project</v-list-subheader>

      <v-list-item
         @click="store.uploader_open = true"
      >
        <template v-slot:prepend>
          <v-icon  icon="mdi-file"></v-icon>
        </template>
     
          <v-list-item-title >Add file</v-list-item-title>
      </v-list-item>

      <v-divider inset></v-divider>


    </v-list>

        <RootNodes @fit-to-node="fitToNode" />
      </v-navigation-drawer>


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