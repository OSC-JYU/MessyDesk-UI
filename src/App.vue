<script setup>

    import "bootstrap/dist/css/bootstrap.min.css"
    import 'bootstrap-icons/font/bootstrap-icons.css'
    import "bootstrap"
    import { onMounted, onUnmounted, reactive } from 'vue'
    import {store} from "./components/Store.js";

    var intervalID = null

  var session = reactive({error: null})

async function login() {
  if(store.logged_out) return
  try {
    var response = await fetch('/api')
    // valid session but not registered user
    if (response.status == 401 && !window.location.pathname.includes('login')) {
      window.location.href = 'login'
    // expired session
    } else if (response.status == 302) {
      store.logged_out = true
    } else if (response.status == 200 && window.location.pathname.includes('login')) {
      // go to to main site
      window.location.href = '/'
    }
  } catch (e) {
    console.log(e)
    session.error = e
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