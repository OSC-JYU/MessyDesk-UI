import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingState from '@/ui/LoadingState.vue'

describe('LoadingState', () => {
  it('shows a spinner with the default label', () => {
    const wrapper = mount(LoadingState)
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.find('.v-progress-circular').exists()).toBe(true)
    expect(wrapper.text()).toContain('Loading…')
  })

  it('supports a custom label and inline layout', () => {
    const wrapper = mount(LoadingState, { props: { text: 'Loading projects', inline: true } })
    expect(wrapper.text()).toContain('Loading projects')
    expect(wrapper.classes()).toContain('loading-state--inline')
  })
})
