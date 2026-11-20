// Helpers for demo desks.

// Titles and descriptions are { <language code>: text }. The user's language first, then English,
// then whatever the demo has.
export function pickText(texts, locale) {
  if (!texts || typeof texts !== 'object') return ''
  const language = String(locale || '').split('-')[0]
  return texts[locale] || texts[language] || texts.en || Object.values(texts)[0] || ''
}

export function formatSize(bytes) {
  const size = Number(bytes) || 0
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} kB`
  if (size < 1024 ** 3) return `${(size / 1024 ** 2).toFixed(1)} MB`
  return `${(size / 1024 ** 3).toFixed(1)} GB`
}
