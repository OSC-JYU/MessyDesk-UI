import { describe, it, expect } from 'vitest'
import {
  buildProcess,
  categoryTabs,
  fillInfo,
  inCategory,
  prepareCatalogue,
  processTarget,
  searchCatalogue,
} from '@/features/services/crunchers/crunchers.js'

const result = {
  for_format: [
    { id: 'thumbnailer', tasks: { t: { name: 'Thumb' } } },
    { id: 'md-empty', tasks: {} },
    { id: 'md-internal', category: 'system', tasks: { t: { name: 'Internal' } } },
    {
      id: 'md-ocr',
      name: 'Tesseract',
      category: 'preparation',
      tasks: {
        zeta: { name: 'Zeta' },
        ocr: {
          name: 'OCR',
          description: 'Read printed text',
          params_help: {
            lang: {
              name: 'Language',
              display: 'dropdown',
              values: { fin: 'Finnish', eng: 'English' },
              default: 'fin',
            },
            pages: { name: 'Pages', multi: true },
          },
        },
      },
    },
    { id: 'md-odd', name: 'Odd one', category: 'weird', tasks: { x: { name: 'X' } } },
  ],
  filters: [{ id: 'mdf-set-filter', name: 'Tag filter', category: 'preparation' }],
}

describe('prepareCatalogue', () => {
  const catalogue = prepareCatalogue(result)

  it('drops the thumbnailer, services without tasks and system services', () => {
    expect(catalogue.services.map((s) => s.id)).toEqual(['md-ocr', 'md-odd'])
  })

  it('sorts tasks by name and sets parameter defaults', () => {
    const ocr = catalogue.services[0]
    expect(ocr.tasks.map((t) => t.key)).toEqual(['ocr', 'zeta'])
    expect(ocr.tasks[0].values).toEqual({ lang: 'fin', pages: [] })
  })

  it('turns value maps into dropdown items', () => {
    expect(catalogue.services[0].tasks[0].params_help.lang.values).toEqual([
      { value: 'fin', title: 'Finnish' },
      { value: 'eng', title: 'English' },
    ])
  })

  it('adds an Uncategorized tab only when something needs it', () => {
    expect(categoryTabs(catalogue).at(-1).value).toBe('uncategorized')
    expect(inCategory(catalogue.services, 'uncategorized').map((s) => s.id)).toEqual(['md-odd'])
    expect(categoryTabs(prepareCatalogue({ for_format: [result.for_format[3]] }))).toHaveLength(4)
  })

  it('finds tasks and filters by text', () => {
    const found = searchCatalogue(catalogue, 'printed')
    expect(found.map((r) => r.key)).toEqual(['task:md-ocr:ocr'])
    expect(searchCatalogue(catalogue, 'tag filter').map((r) => r.kind)).toEqual(['filter'])
    expect(searchCatalogue(catalogue, '  ')).toEqual([])
  })
})

describe('buildProcess', () => {
  it('builds a plain process request', () => {
    const task = { key: 'ocr', values: { lang: 'fin' } }
    expect(buildProcess({ id: 'md-ocr' }, task)).toEqual({
      service: 'md-ocr',
      id: 'ocr',
      params: { lang: 'fin' },
    })
  })

  it('adds the model, external task details, output settings and info text', () => {
    const service = { id: 'md-llm', external_tasks: true }
    const task = {
      key: 'describe',
      name: 'Describe',
      description: 'Describe the image',
      system_params: { prompt: 'x' },
      output_type: 'json',
      json_schema: '{}',
      info: 'Language: {{lang}}, pages: {{pages}}',
      values: { lang: 'fin', pages: '' },
    }
    expect(buildProcess(service, task, 'gpt')).toEqual({
      service: 'md-llm',
      id: 'describe',
      params: task.values,
      model: 'gpt',
      name: 'Describe',
      description: 'Describe the image',
      system_params: { prompt: 'x', output_type: 'json', json_schema: '{}' },
      info: 'Language: fin, pages: Not given',
    })
  })
})

describe('fillInfo', () => {
  it('replaces every placeholder', () => {
    expect(fillInfo('{{a}} and {{a}}', { a: 'x' })).toBe('x and x')
  })
})

describe('processTarget', () => {
  it.each([
    ['source', '', 'source'],
    ['set', '', 'set'],
    ['search-set', '', 'set'],
    ['image', 'ROI', 'roi'],
    ['image', '', 'file'],
  ])('%s with filter "%s" runs on %s', (type, filter, target) => {
    expect(processTarget(type, filter)).toBe(target)
  })
})
