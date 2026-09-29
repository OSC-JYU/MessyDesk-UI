import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PageHeader from '@/ui/PageHeader.vue'

describe('PageHeader', () => {
  it('renders the title as the page heading and the subtitle', () => {
    const wrapper = mount(PageHeader, { props: { title: 'Services', subtitle: '1 running' } })
    expect(wrapper.get('h1').text()).toBe('Services')
    expect(wrapper.text()).toContain('1 running')
  })

  it('leaves out the subtitle and actions when not given', () => {
    const wrapper = mount(PageHeader, { props: { title: 'Services' } })
    expect(wrapper.find('.page-header__subtitle').exists()).toBe(false)
    expect(wrapper.find('.page-header__actions').exists()).toBe(false)
  })

  it('renders the actions slot', () => {
    const wrapper = mount(PageHeader, {
      props: { title: 'Services' },
      slots: { actions: '<button>Reload</button>' },
    })
    expect(wrapper.get('.page-header__actions button').text()).toBe('Reload')
  })
})
