import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ServiceGroupsTab from '@/features/admin/ServiceGroupsTab.vue'

describe('ServiceGroupsTab', () => {
  it('edits token limits and shows the usage of the month', async () => {
    const group = {
      id: 'AZURE-AI',
      name: 'Azure',
      token_limits: { period: 'month', per_user: 1000 },
    }
    const wrapper = mount(ServiceGroupsTab, {
      props: { groups: [group], usage: { 'AZURE-AI': 12345 }, uploadLogo: async () => {} },
    })
    expect(wrapper.text()).toContain('Used this month: 12,345')
    const field = wrapper.find('input[aria-label="Whole group token limit of AZURE-AI"]')
    await field.setValue('50000')
    await field.trigger('blur')
    expect(wrapper.emitted('save')[0][0].token_limits).toEqual({
      period: 'month',
      per_user: 1000,
      group_total: '50000',
    })
  })
})
