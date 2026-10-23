import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import DeleteDeskDialog from '@/features/home/DeleteDeskDialog.vue'

const desk = { rid: '#1:0', name: 'Letters 1917' }

function confirmButton() {
  return document.body.querySelector('[data-test="confirm"]')
}

async function typeName(value) {
  const input = document.body.querySelector('[data-test="delete-desk-name"] input')
  input.value = value
  input.dispatchEvent(new Event('input'))
  await flushPromises()
}

async function mountOpen(remove) {
  const wrapper = mount(DeleteDeskDialog, {
    props: { modelValue: false, desk, remove },
    attachTo: document.body,
  })
  await wrapper.setProps({ modelValue: true })
  await flushPromises()
  return wrapper
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('DeleteDeskDialog', () => {
  it('keeps delete disabled until the desk name is typed', async () => {
    await mountOpen(vi.fn())
    expect(confirmButton().disabled).toBe(true)
    await typeName('Letters')
    expect(confirmButton().disabled).toBe(true)
    await typeName('Letters 1917')
    expect(confirmButton().disabled).toBe(false)
  })

  it('deletes the desk and closes', async () => {
    const remove = vi.fn().mockResolvedValue()
    const wrapper = await mountOpen(remove)
    await typeName('Letters 1917')
    confirmButton().click()
    await flushPromises()
    expect(remove).toHaveBeenCalledWith('#1:0')
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([false])
  })

  it('stays open and shows the error when deleting fails', async () => {
    const remove = vi.fn().mockRejectedValue({ status: 500, message: 'DB is not available' })
    const wrapper = await mountOpen(remove)
    await typeName('Letters 1917')
    confirmButton().click()
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(document.body.textContent).toContain('DB is not available')
  })
})
