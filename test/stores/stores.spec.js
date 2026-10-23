import { describe, it, expect } from 'vitest'
import { fileBrowse, browseFromResults } from '@/stores/fileBrowse.js'
import { session } from '@/stores/session.js'
import { recall, remember } from '@/stores/pageMemory.js'

describe('fileBrowse', () => {
  it('opens a file with its result list', () => {
    browseFromResults({ '@rid': '#1:0' }, 'kirje', [{ rid: '#1:0' }], 0)
    expect(fileBrowse.file['@rid']).toBe('#1:0')
    expect(fileBrowse.context).toMatchObject({ mode: 'search', query: 'kirje', index: 0 })
  })
})

describe('session', () => {
  it('knows admins', () => {
    session.user = { id: 'a@b', access: 'admin' }
    expect(session.isAdmin).toBe(true)
    session.user = { id: 'a@b', access: 'user' }
    expect(session.isAdmin).toBe(false)
  })
})

describe('pageMemory', () => {
  it('remembers per screen and scope', () => {
    remember('search', 'global', { query: 'a' })
    remember('search', '1:0', { query: 'b' })
    expect(recall('search', 'global').query).toBe('a')
    expect(recall('search', '1:0').query).toBe('b')
    expect(recall('tags', 'global')).toBeNull()
  })
})
