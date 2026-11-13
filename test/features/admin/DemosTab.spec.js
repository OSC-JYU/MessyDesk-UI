import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import DemosTab from '@/features/admin/DemosTab.vue'

const demo = {
  id: 'd1',
  version: 2,
  title: { en: 'Letters' },
  description: {},
  service_groups: ['OSC'],
  users: ['a@x.fi'],
  files: 1,
  size: 2048,
}

vi.mock('@/api/demos.js', () => ({
  getAdminDemos: vi.fn(async () => [demo]),
  createDemo: vi.fn(),
  deleteDemo: vi.fn(async () => ({ deleted: true })),
  reexportDemo: vi.fn(),
  updateDemo: vi.fn(),
  uploadDemoBundle: vi.fn(),
  uploadDemoCover: vi.fn(),
  demoBundleUrl: (d) => `/api/admin/demos/${d.id}/bundle`,
}))
vi.mock('@/api/admin.js', () => ({ getServiceGroups: vi.fn(async () => [{ id: 'OSC' }]) }))
vi.mock('@/api/projects.js', () => ({
  getProjects: vi.fn(async () => [{ '@rid': '#1:1', label: 'Desk' }]),
}))

describe('DemosTab', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists demos with version, size and who they are shared with', async () => {
    const wrapper = mount(DemosTab)
    await flushPromises()
    const text = wrapper.text()
    expect(text).toContain('Letters')
    expect(text).toContain('1 file')
    expect(text).toContain('2 kB')
    expect(text).toContain('OSC, a@x.fi')
    expect(wrapper.find('a[aria-label="Download Letters"]').attributes('href')).toBe(
      '/api/admin/demos/d1/bundle',
    )
  })
})

describe('DemoFormDialog', () => {
  it('suggests the title and description of the chosen desk', async () => {
    const { default: DemoFormDialog } = await import('@/features/admin/DemoFormDialog.vue')
    const wrapper = mount(DemoFormDialog, {
      props: {
        modelValue: false,
        groups: [],
        desks: [{ '@rid': '#1:1', label: 'Letters', description: 'Old letters' }],
      },
    })
    await wrapper.setProps({ modelValue: true })
    wrapper.vm.form.project = '#1:1'
    await flushPromises()
    expect(wrapper.vm.form.titleEn).toBe('Letters')
    expect(wrapper.vm.form.descriptionEn).toBe('Old letters')
  })
})
