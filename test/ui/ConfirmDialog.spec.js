import { describe, it, expect, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ConfirmDialog from '@/ui/ConfirmDialog.vue'

// The dialog teleports to document.body, so query the document.
function button(name) {
  return document.body.querySelector(`[data-test="${name}"]`)
}

async function mountOpen(props = {}) {
  const wrapper = mount(ConfirmDialog, {
    props: { modelValue: true, title: 'Delete node', message: 'Children go too.', ...props },
    attachTo: document.body,
  })
  await flushPromises()
  return wrapper
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('ConfirmDialog', () => {
  it('shows the title, message and button labels', async () => {
    await mountOpen({ confirmText: 'Delete', cancelText: 'Keep' })
    expect(document.body.textContent).toContain('Delete node')
    expect(document.body.textContent).toContain('Children go too.')
    expect(button('confirm').textContent).toContain('Delete')
    expect(button('cancel').textContent).toContain('Keep')
  })

  it('emits confirm and leaves closing to the parent', async () => {
    const wrapper = await mountOpen()
    button('confirm').click()
    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('closes and emits cancel on cancel', async () => {
    const wrapper = await mountOpen()
    button('cancel').click()
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('cannot be cancelled while loading', async () => {
    const wrapper = await mountOpen({ loading: true })
    expect(button('cancel').disabled).toBe(true)
    button('cancel').click()
    expect(wrapper.emitted('cancel')).toBeUndefined()
  })

  it('keeps confirm disabled when asked', async () => {
    await mountOpen({ confirmDisabled: true })
    expect(button('confirm').disabled).toBe(true)
  })

  it('shows an error', async () => {
    await mountOpen({ error: 'Deleting node failed' })
    expect(document.body.textContent).toContain('Deleting node failed')
  })
})
