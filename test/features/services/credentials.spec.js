import { describe, it, expect } from 'vitest'
import { encodeCredentials, decodeCredentials } from '@/features/services/crunchers/credentials.js'

const fields = [
  { name: 'token', label: 'FirecREST token', secret: true, required: true },
  { name: 'project', label: 'CSC project', secret: false, required: true },
  { name: 'allas_project', label: 'Allas project', secret: false, required: false },
]

describe('encodeCredentials', () => {
  it('round-trips the values with the mdcred1 prefix and base64url alphabet', () => {
    const { key, errors } = encodeCredentials({ token: 'abc', project: 'project_1' }, fields)
    expect(errors).toBeUndefined()
    expect(key).toMatch(/^mdcred1\.[A-Za-z0-9_-]+$/)
    expect(decodeCredentials(key)).toEqual({ token: 'abc', project: 'project_1' })
  })

  it('trims values and drops empty optional ones', () => {
    const { key } = encodeCredentials(
      { token: '  abc ', project: ' p ', allas_project: '   ', other: 'x' },
      fields,
    )
    expect(decodeCredentials(key)).toEqual({ token: 'abc', project: 'p' })
  })

  it('encodes exactly the base64url of the JSON', () => {
    const { key } = encodeCredentials({ token: 'a', project: 'b' }, fields)
    const expected = Buffer.from(JSON.stringify({ token: 'a', project: 'b' }), 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    expect(key).toBe(`mdcred1.${expected}`)
  })

  it('reports each missing required field', () => {
    const { key, errors } = encodeCredentials({ token: ' ' }, fields)
    expect(key).toBeUndefined()
    expect(errors).toEqual({
      token: 'Enter the FirecREST token',
      project: 'Enter the CSC project',
    })
  })

  it('rejects a key longer than 7000 characters', () => {
    const { key, errors } = encodeCredentials({ token: 'a'.repeat(6000), project: 'p' }, fields)
    expect(key).toBeUndefined()
    expect(errors.token).toMatch(/too long/i)
  })

  it('handles unicode values', () => {
    const values = { token: 'tökén-ääkköset-日本語-😀', project: 'p' }
    const { key } = encodeCredentials(values, fields)
    expect(key).toMatch(/^[\x21-\x7e]+$/)
    expect(decodeCredentials(key)).toEqual(values)
  })
})

describe('decodeCredentials', () => {
  it('returns null for other keys', () => {
    expect(decodeCredentials('sk-123')).toBeNull()
    expect(decodeCredentials('mdcred1.!!!')).toBeNull()
  })
})
