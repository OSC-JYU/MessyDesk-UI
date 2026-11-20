import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import LearnCard from '@/features/home/LearnCard.vue'
import { formatSize, pickText } from '@/features/home/demos.js'

function mountCard(props) {
  const i18n = createI18n({ locale: 'fi', legacy: false, messages: { fi: {}, en: {} } })
  return mount(LearnCard, { props, global: { plugins: [i18n] } })
}

const demo = {
  id: 'd1',
  version: 1,
  title: { en: 'Letters', fi: 'Kirjeet' },
  description: { en: 'Read old letters' },
  has_cover: false,
}

describe('pickText', () => {
  it('prefers the language, then English, then anything', () => {
    expect(pickText({ en: 'a', fi: 'b' }, 'fi')).toBe('b')
    expect(pickText({ en: 'a', fi: 'b' }, 'sv')).toBe('a')
    expect(pickText({ de: 'c' }, 'fi')).toBe('c')
    expect(pickText(null, 'fi')).toBe('')
  })
})

describe('formatSize', () => {
  it('uses kB, MB and GB', () => {
    expect(formatSize(100)).toBe('1 kB')
    expect(formatSize(5 * 1024 * 1024)).toBe('5.0 MB')
    expect(formatSize(3 * 1024 ** 3)).toBe('3.0 GB')
  })
})

describe('LearnCard', () => {
  it('is hidden when there are no demos', () => {
    const wrapper = mountCard({ demos: [] })
    expect(wrapper.text()).toBe('')
  })

  it('shows the title in the user language and asks to open a demo', async () => {
    const wrapper = mountCard({ demos: [demo] })
    expect(wrapper.text()).toContain('Kirjeet')
    expect(wrapper.text()).toContain('Read old letters')
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('copy')[0][0].id).toBe('d1')
  })

  it('marks a copied demo and does not copy it again', () => {
    const wrapper = mountCard({ demos: [demo], copied: { d1: '1:2' } })
    expect(wrapper.text()).toContain('Copied to your desks')
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('disables the other demos while one is being copied', () => {
    const second = { ...demo, id: 'd2' }
    const wrapper = mountCard({ demos: [demo, second], importing: 'd1' })
    const buttons = wrapper.findAll('button')
    expect(buttons[1].attributes('disabled')).toBeDefined()
  })
})
