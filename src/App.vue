<script setup>

    import "bootstrap/dist/css/bootstrap.min.css"
    import 'bootstrap-icons/font/bootstrap-icons.css'
    import "bootstrap"
    import { onMounted, onUnmounted, reactive } from 'vue'
    import {store} from "./components/Store.js";
    import web from "./web.js";

    var intervalID = null

  var session = reactive({error: null})

async function login() {
  //if(store.logged_out) return
  try {
    var response = await web.ready()
    // if we are in login page and we have a valid session
    if(window.location.pathname.includes('login'))
      window.location.href = import.meta.env.VITE_PUBLIC_PATH || '/'

  } catch (e) {
    console.log(e)
    // valid session but not user permissions
    if (e.request.status == 401 && !window.location.pathname.includes('login')) {
      window.location.href = 'login'

    // expired session
    } else if (e.request.status == 302) {
      store.logged_out = true
    } else {
      store.logged_out = true
    }
  }

}

function reload() {
  window.location.reload()
}

onMounted(() => {
  login()
  intervalID = setInterval(() => login(), 30000);
});

onUnmounted(() => {
  clearInterval(intervalID)
});

</script>

<template>
	<div id="app">
      <template v-if="store.logged_out">
        <div class="d-flex justify-content-center">
          <div class="alert alert-danger" role="alert">
            Your session expired
            <v-btn @click="reload();">reload page</v-btn>
          </div>
        </div>
        
      </template>
      <template v-else>

          <!-- <router-view class="view" ></router-view> -->
          <router-view v-slot="{ Component, route }">
          <!-- keep search alive -->
          <keep-alive>
            <component :is="Component" v-if="route.name === 'search'" />
          </keep-alive>
        
          <component :is="Component" v-if="route.name !== 'search'"  />
        
      </router-view>
    </template>
	</div>

</template>

<style>
@import './assets/base.css';

</style>