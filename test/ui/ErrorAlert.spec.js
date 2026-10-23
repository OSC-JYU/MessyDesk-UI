import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ErrorAlert from '@/ui/ErrorAlert.vue'

describe('ErrorAlert', () => {
  it('renders nothing without an error', () => {
    const wrapper = mount(ErrorAlert, { props: { error: null } })
    expect(wrapper.find('.v-alert').exists()).toBe(false)
  })

  it('shows a string error', () => {
    const wrapper = mount(ErrorAlert, { props: { error: 'Saving failed' } })
    expect(wrapper.text()).toContain('Saving failed')
  })

  it('shows the message of an API error object', () => {
    const wrapper = mount(ErrorAlert, {
      props: { error: { status: 500, message: 'DB is not available' } },
    })
    expect(wrapper.text()).toContain('DB is not available')
  })

  it('explains a network error', () => {
    const wrapper = mount(ErrorAlert, { props: { error: { status: 0, message: 'Network error' } } })
    expect(wrapper.text()).toContain('Could not reach the server')
  })

  it('emits retry when retryable', async () => {
    const wrapper = mount(ErrorAlert, { props: { error: 'Loading failed', retryable: true } })
    await wrapper.get('[data-test="retry"]').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})
