import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusChip from '@/ui/StatusChip.vue'

describe('StatusChip', () => {
  it.each([
    ['running', 'Running', 'text-info'],
    ['FAILED', 'Failed', 'text-error'],
    ['done', 'Done', 'text-success'],
    ['paused', 'Paused', 'text-warning'],
  ])('shows %s as %s', (status, label, colourClass) => {
    const wrapper = mount(StatusChip, { props: { status } })
    expect(wrapper.text()).toBe(label)
    expect(wrapper.classes()).toContain(colourClass)
  })

  it('shows an unknown status as given', () => {
    const wrapper = mount(StatusChip, { props: { status: 'warming-up' } })
    expect(wrapper.text()).toBe('warming-up')
  })

  it('uses a custom label', () => {
    const wrapper = mount(StatusChip, { props: { status: 'running', label: '1 running' } })
    expect(wrapper.text()).toBe('1 running')
  })
})
