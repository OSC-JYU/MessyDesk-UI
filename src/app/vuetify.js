import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { messydeskTheme } from '@/styles/vuetify-theme.js'

export const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'messydesk',
    themes: { messydesk: messydeskTheme },
  },
})
