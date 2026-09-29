// Adds a cache-busting version to a thumbnail URL.
export function versioned(url, version) {
  if (!url) return ''
  if (version === undefined || version === null || version === '') return url
  return `${url}${String(url).includes('?') ? '&' : '?'}v=${version}`
}
