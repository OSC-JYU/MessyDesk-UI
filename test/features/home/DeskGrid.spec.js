import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DeskGrid from '@/features/home/DeskGrid.vue'
import { toDeskRow } from '@/features/home/desks.js'

const router = { template: '<a><slot /></a>' }
const mountGrid = (props) =>
  mount(DeskGrid, { props, global: { stubs: { 'router-link': router } } })

describe('toDeskRow', () => {
  it('carries the description and the cover url', () => {
    const row = toDeskRow(
      { '@rid': '#1:2', label: 'Letters', description: ' About ', cover: { url: '/c.png' } },
      null,
    )
    expect(row.description).toBe('About')
    expect(row.cover).toBe('/c.png')
    expect(toDeskRow({ '@rid': '#1:3', label: 'x', cover: null }, null).cover).toBe('')
  })
})

describe('DeskGrid', () => {
  it('shows a card with the name for each desk', () => {
    const rows = [
      toDeskRow({ '@rid': '#1:2', label: 'Letters', cover: { url: '/c.png' } }, null),
      toDeskRow({ '@rid': '#1:3', label: 'Photos' }, null),
    ]
    const wrapper = mountGrid({ rows })
    expect(wrapper.text()).toContain('Letters')
    expect(wrapper.text()).toContain('Photos')
    expect(wrapper.findAll('img')).toHaveLength(1)
    expect(wrapper.text()).toContain('Not counted yet')
    expect(wrapper.text()).toContain('Expires')
  })

  it('says so when there are no desks', () => {
    expect(mountGrid({ rows: [] }).text()).toContain('No desks yet')
  })
})
