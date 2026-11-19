import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TextRoiTagPicker from '@/features/files/roi/TextRoiTagPicker.vue'

const tags = [
  { rid: '#7:1', label: 'Anger', color: '#e6194b' },
  { rid: '#7:2', label: 'Hope', color: '#3cb44b' },
]

const make = (props = {}) =>
  mount(TextRoiTagPicker, { props: { tags, position: { top: 0, left: 0 }, ...props } })

describe('TextRoiTagPicker', () => {
  it('offers the tags that the passage does not have yet', () => {
    const wrapper = make({ applied: [tags[0]] })
    expect(wrapper.findAll('.tag-pop__tag').map((b) => b.text())).toEqual(['Hope'])
  })

  it('applies the first match with Enter', async () => {
    const wrapper = make()
    await wrapper.find('input').setValue('ho')
    await wrapper.find('input').trigger('keydown.enter')
    expect(wrapper.emitted('pick')[0][0]).toEqual(tags[1])
  })

  it('offers to create a tag that does not exist, and creates it with Enter', async () => {
    const wrapper = make()
    await wrapper.find('input').setValue('Fear')
    expect(wrapper.find('.tag-pop__tag--new').text()).toContain('Fear')
    await wrapper.find('input').trigger('keydown.enter')
    expect(wrapper.emitted('create')[0]).toEqual(['Fear'])
  })

  it('can be dismissed without a tag', async () => {
    const wrapper = make()
    await wrapper.find('.tag-pop__close').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    await wrapper.find('.tag-pop').trigger('keydown.esc')
    expect(wrapper.emitted('close')).toHaveLength(2)
  })
})
