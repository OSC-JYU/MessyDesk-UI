import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SectionCard from '@/ui/SectionCard.vue'

describe('SectionCard', () => {
  it('renders overline, title, actions and body', () => {
    const wrapper = mount(SectionCard, {
      props: { title: 'Disk usage', overline: 'Your storage' },
      slots: { default: '<p>0 GB used</p>', actions: '<button>Refresh</button>' },
    })
    expect(wrapper.get('h2').text()).toBe('Disk usage')
    expect(wrapper.get('.section-card__overline').text()).toBe('Your storage')
    expect(wrapper.get('.section-card__actions button').text()).toBe('Refresh')
    expect(wrapper.get('.section-card__body').text()).toBe('0 GB used')
  })

  it('leaves out the overline and actions when not given', () => {
    const wrapper = mount(SectionCard, { props: { title: 'News' } })
    expect(wrapper.find('.section-card__overline').exists()).toBe(false)
    expect(wrapper.find('.section-card__actions').exists()).toBe(false)
  })
})
