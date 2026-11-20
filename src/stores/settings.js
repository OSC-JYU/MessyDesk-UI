import { reactive } from 'vue'
import { saveSettings } from '@/api/session.js'

// The user's UI settings, saved on the backend (PUT /api/me/settings) and
// kept in localStorage so the page starts in the right theme before /api/me
// has answered. src/app/vuetify.js applies them.

// `vuetify` is the Vuetify theme name (src/styles/vuetify-theme.js); "system"
// switches between Fjord light and dark with the OS setting.
export const THEME_OPTIONS = [
  { value: 'light', title: 'Fjord', icon: 'mdi-white-balance-sunny', vuetify: 'fjord' },
  { value: 'dark', title: 'Fjord dark', icon: 'mdi-weather-night', vuetify: 'fjordDark' },
  { value: 'system', title: 'Follow the system', icon: 'mdi-monitor' },
  { value: 'navy', title: 'Navy', icon: 'mdi-white-balance-sunny', vuetify: 'navy' },
  { value: 'navy-dark', title: 'Navy dark', icon: 'mdi-weather-night', vuetify: 'navyDark' },
  { value: 'slate', title: 'Slate', icon: 'mdi-white-balance-sunny', vuetify: 'slate' },
  { value: 'warm', title: 'Reading room', icon: 'mdi-white-balance-sunny', vuetify: 'warm' },
  {
    value: 'warm-dark',
    title: 'Reading room dark',
    icon: 'mdi-weather-night',
    vuetify: 'warmDark',
  },
]

export const COOKIE_OPTIONS = [
  { value: 'classic', title: 'Classic' },
  { value: 'chocolate', title: 'Double chocolate' },
  { value: 'matcha', title: 'Matcha' },
  { value: 'strawberry', title: 'Strawberry' },
  { value: 'blueberry', title: 'Blueberry' },
]

export const MOTION_OPTIONS = [
  { value: 'on', title: 'Animations on' },
  { value: 'off', title: 'Reduce motion' },
]

export const GROUP_PDF_OPTIONS = [
  { value: 'on', title: 'One card per PDF' },
  { value: 'off', title: 'All files in a row' },
]

export const LINEAGE_COMPARE_OPTIONS = [
  { value: 'on', title: 'Side by side' },
  { value: 'off', title: 'Replace the file' },
]

export const HIDE_DEMOS_OPTIONS = [
  { value: 'off', title: 'Show Learn MessyDesk' },
  { value: 'on', title: 'Hide Learn MessyDesk' },
]

export const DESK_VIEW_OPTIONS = [
  { value: 'grid', title: 'Grid' },
  { value: 'list', title: 'List' },
]

const DEFAULTS = {
  theme: 'light',
  cookie: 'classic',
  motion: 'on',
  group_pdf: 'on',
  lineage_compare: 'on',
  hide_demos: 'off',
  desk_view: 'grid',
}
const STORAGE_KEY = 'md-settings'
const allowed = {
  theme: THEME_OPTIONS.map((o) => o.value),
  cookie: COOKIE_OPTIONS.map((o) => o.value),
  motion: MOTION_OPTIONS.map((o) => o.value),
  group_pdf: GROUP_PDF_OPTIONS.map((o) => o.value),
  lineage_compare: LINEAGE_COMPARE_OPTIONS.map((o) => o.value),
  hide_demos: HIDE_DEMOS_OPTIONS.map((o) => o.value),
  desk_view: DESK_VIEW_OPTIONS.map((o) => o.value),
}

// Known keys with allowed values only.
function clean(values) {
  const out = {}
  for (const key of Object.keys(allowed)) {
    if (allowed[key].includes(values?.[key])) out[key] = values[key]
  }
  return out
}

function readCache() {
  try {
    return clean(JSON.parse(localStorage.getItem(STORAGE_KEY)))
  } catch {
    return {}
  }
}

function writeCache() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings }))
  } catch {
    // Private windows may refuse storage; the backend copy still counts.
  }
}

export const settings = reactive({ ...DEFAULTS, ...readCache() })

// Takes settings the backend sent (GET /api/me or a save).
export function setSettings(values) {
  Object.assign(settings, clean(values))
  writeCache()
}

// Changes one setting right away and saves it; undoes the change when the
// save fails.
export async function saveSetting(key, value) {
  const previous = settings[key]
  settings[key] = value
  try {
    setSettings(await saveSettings({ [key]: value }))
  } catch (error) {
    settings[key] = previous
    throw error
  }
}
