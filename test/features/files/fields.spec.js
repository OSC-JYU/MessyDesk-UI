import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { confidenceLabel, confidenceLevel, excerpt, parseFields } from '@/features/files/fields.js'

const TEXT = 'Invoice 2024-117 from Oy Saha Ab, paid to Johan Virtanen.'
const FILE = {
  format: 'messydesk-fields/1',
  fields: ['invoice_number', 'payee', 'iban'],
  records: [
    {
      invoice_number: { text: '2024-117', confidence: 0.982, start: 8, end: 16 },
      payee: { text: 'Johan Virtanen', confidence: 0.55, start: 42, end: 56 },
      iban: null,
    },
  ],
  source: { rid: '#80:1', label: 'letter.txt' },
}

vi.mock('@/api/files.js', () => ({
  getNodeFile: async (rid) => (rid === '#80:1' ? TEXT : JSON.stringify(FILE)),
}))

describe('fields', () => {
  it('reads records and keeps missing values as null', () => {
    const parsed = parseFields(JSON.stringify(FILE))
    expect(parsed.fields).toEqual(['invoice_number', 'payee', 'iban'])
    expect(parsed.records[0].iban).toBeNull()
    expect(parsed.records[0].payee.text).toBe('Johan Virtanen')
    expect(parseFields({ fields: ['a'], records: [{ a: 'plain' }] }).records[0].a.start).toBeNull()
  })

  it('labels confidence', () => {
    expect(confidenceLabel(0.999)).toBe('99 %')
    expect(confidenceLevel(0.95)).toBe('high')
    expect(confidenceLevel(0.7)).toBe('medium')
    expect(confidenceLevel(0.2)).toBe('low')
    expect(confidenceLevel(null)).toBe('unknown')
  })

  it('cuts the text around a value', () => {
    const parts = excerpt(TEXT, { start: 8, end: 16 }, 5)
    expect(parts).toEqual({ before: '… oice ', match: '2024-117', after: ' from …' })
    expect(excerpt(TEXT, { start: null, end: null })).toBeNull()
    expect(excerpt(TEXT, { start: 50, end: 500 })).toBeNull()
  })
})

describe('FieldsDisplay', () => {
  it('shows a table and the place of a picked value in the text', async () => {
    const { default: FieldsDisplay } = await import('@/features/files/displays/FieldsDisplay.vue')
    const wrapper = mount(FieldsDisplay, {
      props: { file: { '@rid': '#90:1', type: 'fields.json' } },
    })
    await flushPromises()
    expect(wrapper.findAll('th').map((th) => th.text())).toEqual([
      'invoice_number',
      'payee',
      'iban',
    ])
    expect(wrapper.text()).toContain('98 %')
    await wrapper.findAll('button.fields__value')[1].trigger('click')
    await flushPromises()
    expect(wrapper.find('mark').text()).toBe('Johan Virtanen')
    expect(wrapper.text()).toContain('in letter.txt')
  })
})
