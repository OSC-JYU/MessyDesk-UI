import { describe, it, expect } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import CrunchIcon from '@/ui/CrunchIcon.vue'

describe('CrunchIcon', () => {
  it('draws a bitten cookie with its own bite mask and a plus badge', () => {
    const two = mount({ render: () => h('div', [h(CrunchIcon), h(CrunchIcon)]) })
    const ids = two.findAll('mask').map((m) => m.attributes('id'))
    expect(ids[0]).not.toBe(ids[1])
    const a = mount(CrunchIcon)
    const maskA = a.get('mask').attributes('id')
    expect(a.get('g[mask]').attributes('mask')).toBe(`url(#${maskA})`)
    expect(a.findAll('.crunch-icon__crumb')).toHaveLength(3)
    expect(a.find('.crunch-icon__plus').exists()).toBe(true)
    expect(a.attributes('aria-hidden')).toBe('true')
  })

  it('can leave out the plus and change size', () => {
    const icon = mount(CrunchIcon, { props: { plus: false, size: 26 } })
    expect(icon.find('.crunch-icon__plus').exists()).toBe(false)
    expect(icon.attributes('width')).toBe('26')
  })
})
