import { reactive } from 'vue'
import { saveSettings } from '@/api/session.js'

// The user's UI settings, saved on the backend (PUT /api/me/settings) and
// kept in localStorage so the page starts in the right theme before /api/me
// has answered. src/app/vuetify.js applies them.

export const THEME_OPTIONS = [
  { value: 'light', title: 'Fjord light', icon: 'mdi-white-balance-sunny' },
  { value: 'dark', title: 'Fjord dark', icon: 'mdi-weather-night' },
  { value: 'system', title: 'Follow the system', icon: 'mdi-monitor' },
]

export const COOKIE_OPTIONS = [
  { value: 'classic', title: 'Classic' },
  { value: 'chocolate', title: 'Double chocolate' },
  { value: 'matcha', title: 'Matcha' },
  { value: 'strawberry', title: 'Strawberry' },
  { value: 'blueberry', title: 'Blueberry' },
]

const DEFAULTS = { theme: 'light', cookie: 'classic' }
const STORAGE_KEY = 'md-settings'
const allowed = {
  theme: THEME_OPTIONS.map((o) => o.value),
  cookie: COOKIE_OPTIONS.map((o) => o.value),
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
