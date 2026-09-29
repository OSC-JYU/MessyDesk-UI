import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { ref, watch, watchEffect } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import * as themes from '@/styles/vuetify-theme.js'
import { settings, THEME_OPTIONS } from '@/stores/settings.js'

const { themeAttribute } = themes

export const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'fjord',
    themes: Object.fromEntries(Object.keys(themeAttribute).map((name) => [name, themes[name]])),
  },
})

// Keep the CSS tokens on the same theme as Vuetify.
watch(
  () => vuetify.theme.global.name.value,
  (name) => (document.documentElement.dataset.theme = themeAttribute[name] || 'fjord'),
  { immediate: true },
)

// The theme the user picked in Settings; "system" follows the OS setting and
// changes with it (Fjord light or dark).
const darkQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
const systemDark = ref(Boolean(darkQuery?.matches))
darkQuery?.addEventListener?.('change', (event) => (systemDark.value = event.matches))

watchEffect(() => {
  const chosen = THEME_OPTIONS.find((option) => option.value === settings.theme)
  if (chosen?.vuetify) vuetify.theme.global.name.value = chosen.vuetify
  else vuetify.theme.global.name.value = systemDark.value ? 'fjordDark' : 'fjord'
})

// "Reduce motion" in Settings turns the playful animations off (reset.css).
watchEffect(() => (document.documentElement.dataset.motion = settings.motion))

// The cookie colour preset (tokens.css).
watchEffect(() => (document.documentElement.dataset.cookie = settings.cookie))
