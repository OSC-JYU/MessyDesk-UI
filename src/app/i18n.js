import { createI18n } from 'vue-i18n'
import messages from '../../lang/messages.json'

export const i18n = createI18n({
  locale: 'fi',
  fallbackLocale: import.meta.env.VITE_FALLBACK_LOCALE,
  legacy: false,
  globalInjection: true,
  messages,
})
