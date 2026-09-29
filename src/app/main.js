import { createApp } from 'vue'
import { vuetify } from './vuetify.js'

import '@/styles/fonts.css'
import '@/styles/tokens.css'
import '@/styles/reset.css'

import { router } from './router.js'
import { i18n } from './i18n.js'
import App from './App.vue'

createApp(App).use(vuetify).use(router).use(i18n).mount('#app')
