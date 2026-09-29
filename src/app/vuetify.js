import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { ref, watch, watchEffect } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { fjord, fjordDark, themeAttribute } from '@/styles/vuetify-theme.js'
import { settings } from '@/stores/settings.js'

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

// The theme the user picked in Settings; "system" follows the OS setting and
// changes with it.
const darkQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
const systemDark = ref(Boolean(darkQuery?.matches))
darkQuery?.addEventListener?.('change', (event) => (systemDark.value = event.matches))

watchEffect(() => {
  const dark = settings.theme === 'dark' || (settings.theme === 'system' && systemDark.value)
  vuetify.theme.global.name.value = dark ? 'fjordDark' : 'fjord'
})

// The cookie colour preset (tokens.css).
watchEffect(() => (document.documentElement.dataset.cookie = settings.cookie))
