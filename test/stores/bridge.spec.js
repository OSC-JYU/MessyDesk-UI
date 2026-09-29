import { describe, it, expect } from 'vitest'
import { nextTick, watch } from 'vue'
import { store } from '@/components/Store.js'
import { fileBrowse, browseFromResults } from '@/stores/fileBrowse.js'
import { session } from '@/stores/session.js'
import { recall, remember } from '@/stores/pageMemory.js'

// The old global store still has readers; these fields now live in new stores.
describe('old store bridge', () => {
  it('shares the open file and browse context with stores/fileBrowse', async () => {
    const seen = []
    watch(
      () => store.file,
      (file) => seen.push(file?.['@rid']),
    )
    browseFromResults({ '@rid': '#1:0' }, 'kirje', [{ rid: '#1:0' }], 0)
    await nextTick()
    expect(store.file['@rid']).toBe('#1:0')
    expect(store.file_browse_context).toMatchObject({ mode: 'search', query: 'kirje', index: 0 })
    expect(seen).toEqual(['#1:0'])

    store.file_browse_context = null
    expect(fileBrowse.context).toBeNull()
  })

  it('shares the signed-in user with stores/session', () => {
    store.user = { id: 'a@b', access: 'admin' }
    expect(session.isAdmin).toBe(true)
    session.user = null
    expect(store.user).toBeNull()
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
