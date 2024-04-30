import { createI18n } from 'vue-i18n'
import messages from '../lang/messages.json'

import GraphMain from './components/GraphMain.vue'

import FilesMain from './components/FilesMain.vue'
import ProjectMain from './components/ProjectMain.vue'
import ServicesMain from './components/ServicesMain.vue'

import About from './components/About.vue'

import { createApp } from 'vue'
import App from './App.vue'

let history = import.meta.env.VITE_PUBLIC_PATH
//let history = ''
//
// if(window.location.hostname == 'localhost')
// 	history = ''
// else
// history = '/s/kukako'

// import router functions
import { createRouter, createWebHistory } from 'vue-router'
// setup routes
const router = createRouter({
  history: createWebHistory(history),

  routes: [
    {
      path: '/',
      name: 'Home',
      component: ProjectMain
    },

    {
        path: '/graph',
        name: 'graph',
        component: GraphMain
    },

    {
      path: '/services',
      name: 'services',
      component: ServicesMain
    },

    {
      path: '/files/:rid',
      name: 'files',
      component: FilesMain
    },

    {
      path: '/about',
      name: 'about',
      component: About
  }
  ]
})

const app = createApp(App)

const i18n = createI18n({
  locale: "fi",
  fallbackLocale: import.meta.env.VITE_FALLBACK_LOCALE,
  legacy: false,
  globalInjection: true, // <--- add this
  messages
})

// tell Vue to use router
app.use(router)
app.use(i18n)
app.mount('#app')
