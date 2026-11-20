// Several credentials for one run, packed into the single opaque API key string the backend keeps
// for a run: 'mdcred1.' + base64url(UTF-8 JSON of the non-empty, trimmed values by field name).
// The consumer of the service decodes it the same way.

export const CREDENTIALS_PREFIX = 'mdcred1.'
export const MAX_KEY_LENGTH = 7000

function toBase64Url(text) {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text) {
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4))
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)))
}

// Returns `{ key }`, or `{ errors: { [name]: message } }` when a required value is missing or the
// whole key is too long for the backend.
export function encodeCredentials(values, fields) {
  const picked = {}
  const errors = {}
  for (const field of fields || []) {
    const raw = values?.[field.name]
    const value = typeof raw === 'string' ? raw.trim() : ''
    if (value) picked[field.name] = value
    else if (field.required) errors[field.name] = `Enter the ${field.label || field.name}`
  }
  if (Object.keys(errors).length) return { errors }

  const key = CREDENTIALS_PREFIX + toBase64Url(JSON.stringify(picked))
  if (key.length > MAX_KEY_LENGTH) {
    const longest = Object.keys(picked).sort((a, b) => picked[b].length - picked[a].length)[0]
    return { errors: { [longest]: 'This value is too long' } }
  }
  return { key }
}

// The values a key was built from, or null when it is not a credentials key.
export function decodeCredentials(key) {
  if (typeof key !== 'string' || !key.startsWith(CREDENTIALS_PREFIX)) return null
  try {
    return JSON.parse(fromBase64Url(key.slice(CREDENTIALS_PREFIX.length)))
  } catch {
    return null
  }
}
