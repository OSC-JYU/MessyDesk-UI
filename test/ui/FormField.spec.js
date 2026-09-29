import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FormField from '@/ui/FormField.vue'

const input = `<template #default="{ id, describedby, invalid }">
  <input :id="id" :aria-describedby="describedby" :aria-invalid="invalid" />
</template>`

describe('FormField', () => {
  it('links the label to the control', () => {
    const wrapper = mount(FormField, {
      props: { label: 'Desk name', id: 'desk-name' },
      slots: { default: input },
    })
    expect(wrapper.get('label').attributes('for')).toBe('desk-name')
    expect(wrapper.get('input').attributes('id')).toBe('desk-name')
  })

  it('generates an id when none is given', () => {
    const wrapper = mount(FormField, { props: { label: 'Desk name' }, slots: { default: input } })
    const id = wrapper.get('input').attributes('id')
    expect(id).toBeTruthy()
    expect(wrapper.get('label').attributes('for')).toBe(id)
  })

  it('shows a hint linked with aria-describedby', () => {
    const wrapper = mount(FormField, {
      props: { label: 'Desk name', hint: 'Shown on the home page' },
      slots: { default: input },
    })
    const message = wrapper.get('.form-field__message')
    expect(message.text()).toBe('Shown on the home page')
    expect(wrapper.get('input').attributes('aria-describedby')).toBe(message.attributes('id'))
  })

  it('shows the error instead of the hint and marks the control invalid', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Desk name',
        hint: 'Shown on the home page',
        error: 'Name is required',
        required: true,
      },
      slots: { default: input },
    })
    expect(wrapper.get('.form-field__message').text()).toBe('Name is required')
    expect(wrapper.get('.form-field__message').attributes('role')).toBe('alert')
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('label').text()).toContain('*')
  })
})
