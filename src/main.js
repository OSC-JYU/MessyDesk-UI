import { createI18n } from 'vue-i18n'
import messages from '../lang/messages.json'

import GraphMain from './components/GraphMain.vue'

import StatsMain from './components/StatsMain.vue'
import ProjectMain from './components/ProjectMain.vue'
import ServicesMain from './components/ServicesMain.vue'
import ListMain from './components/ListMain.vue'
import Repositories from './components/Repositories.vue'
import NavigationSettings from './components/NavigationSettings.vue'
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
        path: '/stats',
        name: 'stats',
        component: StatsMain
    },

    {
      path: '/list/:type',
      name: 'list',
      component: ListMain
    },

    {
      path: '/list/:type/:id',
      name: 'list2',
      component: ListMain
    },


    {
          path: '/queries',
          name: 'queries',
          component: NavigationSettings
    },

    {
        path: '/repositories',
        name: 'repositories',
        component: Repositories
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
