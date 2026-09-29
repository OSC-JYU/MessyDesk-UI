import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from '@/ui/EmptyState.vue'

describe('EmptyState', () => {
  it('renders title, text and actions', () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'No results', text: 'Try another search.' },
      slots: { actions: '<button>Clear</button>' },
    })
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.text()).toContain('No results')
    expect(wrapper.text()).toContain('Try another search.')
    expect(wrapper.get('button').text()).toBe('Clear')
  })

  it('leaves out the text when not given', () => {
    const wrapper = mount(EmptyState, { props: { title: 'No results' } })
    expect(wrapper.find('.empty-state__text').exists()).toBe(false)
  })
})
