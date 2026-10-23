import { afterEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import {
  createDeskTag,
  createEntity,
  createEntityType,
  deleteEntityType,
  getEntityTypes,
  createTag,
  deleteEntity,
  getEntityItems,
  getEntityUsage,
  getRoiLabels,
  getTagAdmin,
  getTags,
  importDeskTags,
  removeDeskTag,
  renameEntity,
} from '@/api/entities.js'

const reply = (data = {}) => ({ data })

afterEach(() => vi.restoreAllMocks())

describe('tagged files', () => {
  it('asks for files with any tag by default and for all of them on request', async () => {
    const get = vi.spyOn(axios, 'get').mockResolvedValue(reply([]))
    const tags = [{ '@rid': '#30:1' }, { '@rid': '#30:2' }]
    await getEntityItems(tags, { projectRids: ['#12:3'] })
    await getEntityItems(tags, { projectRids: ['#12:3'], match: 'and' })
    await getEntityItems(tags, { skip: 24, limit: 24 })
    expect(get.mock.calls.map(([url]) => url)).toEqual([
      '/api/entities/items?entities=30%3A1%2C30%3A2&project_rid=12%3A3',
      '/api/entities/items?entities=30%3A1%2C30%3A2&match=and&project_rid=12%3A3',
      '/api/entities/items?entities=30%3A1%2C30%3A2&skip=24&limit=24',
    ])
  })
})

describe('tag creation and listing', () => {
  it('creates a tag in a desk', async () => {
    const post = vi.spyOn(axios, 'post').mockResolvedValue(reply({ result: [] }))
    await createEntity('Place', 'Oulu', '#12:3')
    await createTag('urgent', 'Needs attention', '#12:3')
    expect(post.mock.calls).toEqual([
      ['/api/entities', { project_rid: '12:3', type: 'Place', label: 'Oulu' }],
      ['/api/tags', { project_rid: '12:3', label: 'urgent', description: 'Needs attention' }],
    ])
  })

  it('lists the tags of one desk, or all of them without a desk', async () => {
    const get = vi.spyOn(axios, 'get').mockResolvedValue(reply({ result: [] }))
    await getTags({ projectRid: '#12:3' })
    await getTags()
    expect(get.mock.calls).toEqual([
      ['/api/tags', { params: { project_rid: '12:3' } }],
      ['/api/tags', { params: {} }],
    ])
  })
})

describe('tag admin', () => {
  it('pages the admin list of a desk with a search', async () => {
    const get = vi.spyOn(axios, 'get').mockResolvedValue(reply({ items: [] }))
    await getTagAdmin({ projectRid: '#12:3', search: ' ur ', skip: 50, limit: 25 })
    await getTagAdmin()
    expect(get.mock.calls[0]).toEqual([
      '/api/tags/admin',
      { params: { project_rid: '12:3', skip: 50, limit: 25, search: 'ur' } },
    ])
    expect(get.mock.calls[1][1].params).toEqual({ skip: 0, limit: 50 })
  })

  it('reads usage, renames and deletes by entity rid', async () => {
    const get = vi.spyOn(axios, 'get').mockResolvedValue(reply({ files: 2 }))
    const patch = vi.spyOn(axios, 'patch').mockResolvedValue(reply({ label: 'b' }))
    const del = vi.spyOn(axios, 'delete').mockResolvedValue(reply({ deleted: true }))
    expect(await getEntityUsage('#30:1')).toEqual({ files: 2 })
    await renameEntity('#30:1', 'b')
    await deleteEntity('#30:1')
    expect(get).toHaveBeenCalledWith('/api/entities/30:1/usage')
    expect(patch).toHaveBeenCalledWith('/api/entities/30:1', { label: 'b' })
    expect(del).toHaveBeenCalledWith('/api/entities/30:1')
  })

  it('creates, imports and removes desk tags', async () => {
    const post = vi.spyOn(axios, 'post').mockResolvedValue(reply({ imported: 1 }))
    const del = vi.spyOn(axios, 'delete').mockResolvedValue(reply({ deleted: false }))
    await createDeskTag('#12:3', { label: 'urgent' })
    await importDeskTags('#12:3', { entity_rids: ['#30:1'] })
    await importDeskTags('#12:3', { from_project_rid: '#12:4' })
    await removeDeskTag('#12:3', '#30:1')
    expect(post.mock.calls).toEqual([
      ['/api/projects/12:3/tags', { label: 'urgent' }],
      ['/api/projects/12:3/tags/import', { entity_rids: ['#30:1'] }],
      ['/api/projects/12:3/tags/import', { from_project_rid: '#12:4' }],
    ])
    expect(del).toHaveBeenCalledWith('/api/projects/12:3/tags/30:1')
  })
})

describe('ROI labels', () => {
  it('pages the labels of a desk with a search', async () => {
    const get = vi.spyOn(axios, 'get').mockResolvedValue(reply({ items: [], hasMore: false }))
    await getRoiLabels({ projectRids: ['#12:3'], search: 'per', offset: 100 })
    expect(get).toHaveBeenCalledWith('/api/tags/roi/labels', {
      params: { project_rid: '12:3', offset: 100, limit: 100, search: 'per' },
    })
  })
})

describe('tag types', () => {
  it('lists types, with counts on request', async () => {
    const get = vi.spyOn(axios, 'get').mockResolvedValue(reply([{ type: 'Tag' }]))
    expect(await getEntityTypes()).toEqual([{ type: 'Tag' }])
    await getEntityTypes({ counts: true })
    expect(get.mock.calls).toEqual([
      ['/api/entities/types', { params: {} }],
      ['/api/entities/types', { params: { counts: 1 } }],
    ])
  })

  it('creates a type with an optional colour', async () => {
    const post = vi.spyOn(axios, 'post').mockResolvedValue(reply({ result: [] }))
    await createEntityType('Mood')
    await createEntityType('Mood', '#112233')
    expect(post.mock.calls).toEqual([
      ['/api/entities/types', { type: 'Mood' }],
      ['/api/entities/types', { type: 'Mood', color: '#112233' }],
    ])
  })

  it('deletes a type by its URL-encoded name', async () => {
    const del = vi.spyOn(axios, 'delete').mockResolvedValue(reply({ deleted: true }))
    await deleteEntityType('Old type/x')
    expect(del).toHaveBeenCalledWith('/api/entities/types/Old%20type%2Fx')
  })
})
