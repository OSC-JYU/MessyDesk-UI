// Bootstrap stays loaded until the last old screen is replaced (stage 8).
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap'

import { createApp } from 'vue'
import { vuetify } from './vuetify.js'

import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import '@/styles/tokens.css'
import '@/styles/reset.css'
import '@/styles/legacy.css'

import { router } from './router.js'
import { i18n } from './i18n.js'
import App from './App.vue'

createApp(App).use(vuetify).use(router).use(i18n).mount('#app')
