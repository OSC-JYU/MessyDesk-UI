import { config } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// jsdom lacks these; Vuetify uses them for layout and overlays.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.visualViewport ??= {
  width: 1024,
  height: 768,
  addEventListener() {},
  removeEventListener() {},
}

export const vuetify = createVuetify({ components, directives })
config.global.plugins = [vuetify]
