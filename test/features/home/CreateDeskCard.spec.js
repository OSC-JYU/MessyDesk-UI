import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import CreateDeskCard from '@/features/home/CreateDeskCard.vue'

describe('CreateDeskCard', () => {
  it('asks for a name instead of creating an unnamed desk', async () => {
    const create = vi.fn()
    const wrapper = mount(CreateDeskCard, { props: { create } })
    await wrapper.get('form').trigger('submit')
    expect(create).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Please give your desk a name.')
  })

  it('creates a desk with the trimmed name and clears the field', async () => {
    const create = vi.fn().mockResolvedValue('5:0')
    const wrapper = mount(CreateDeskCard, { props: { create } })
    await wrapper.get('input').setValue('  Letters 1917 ')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(create).toHaveBeenCalledWith('Letters 1917')
    expect(wrapper.get('input').element.value).toBe('')
  })

  it('shows the error when creating fails', async () => {
    const create = vi.fn().mockRejectedValue({ status: 500, message: 'Quota exceeded' })
    const wrapper = mount(CreateDeskCard, { props: { create } })
    await wrapper.get('input').setValue('Letters')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('Quota exceeded')
  })
})
