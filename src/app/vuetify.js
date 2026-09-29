import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { watch } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { fjord, fjordDark, themeAttribute } from '@/styles/vuetify-theme.js'

export const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'fjord',
    themes: { fjord, fjordDark },
  },
})

// Keep the CSS tokens on the same theme as Vuetify.
watch(
  () => vuetify.theme.global.name.value,
  (name) => (document.documentElement.dataset.theme = themeAttribute[name] || 'fjord'),
  { immediate: true },
)
