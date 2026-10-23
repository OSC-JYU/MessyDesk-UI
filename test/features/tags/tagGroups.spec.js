import { describe, it, expect } from 'vitest'
import {
  deskHint,
  groupByRun,
  nerLabelKey,
  roiCriterion,
  roiKey,
  runLabel,
  taggedByText,
} from '@/features/tags/tagGroups.js'

describe('tagGroups', () => {
  it('groups tags by the service and task that made them', () => {
    const groups = groupByRun([
      { service_id: 'md-gliner2', task: 'extract_entities', label: 'person' },
      { service_id: 'md-gliner2', task: 'extract_entities', label: 'place' },
      { service_id: 'md-lingua', task: 'detect_language', label: 'fi' },
    ])
    expect(groups.map((g) => [g.key, g.tags.length])).toEqual([
      ['md-gliner2:extract_entities:', 2],
      ['md-lingua:detect_language:', 1],
    ])
    expect(runLabel(groups[0])).toBe('gliner2: extract entities')
  })

  it('separates runs of different models and names them after model and provider', () => {
    const groups = groupByRun([
      {
        service_id: 'md-llm-azure',
        service_name: 'Azure OpenAI',
        task: 'autotag',
        model: 'gpt-5.1',
        label: 'cat',
      },
      {
        service_id: 'md-llm-azure',
        service_name: 'Azure OpenAI',
        task: 'autotag',
        model: 'gpt-4o',
        label: 'cat',
      },
      { service_id: 'md-llm-openai', task: 'autotag', model: 'gpt-5.1', label: 'cat' },
    ])
    expect(groups.map(runLabel)).toEqual([
      'gpt-5.1 (Azure OpenAI): autotag',
      'gpt-4o (Azure OpenAI): autotag',
      'gpt-5.1 (llm-openai): autotag',
    ])
  })

  it('keys NER labels by run and label', () => {
    expect(nerLabelKey({ service_id: 's', task: 't', label: 'person' })).toBe('s:t:person')
  })

  it('names the desks of a tag, shortening long lists', () => {
    expect(deskHint({ desks: [] })).toBe('')
    expect(deskHint({})).toBe('')
    expect(deskHint({ desks: [{ rid: '#1:1', label: 'A' }] })).toBe('A')
    const desks = ['A', 'B', 'C', 'D'].map((label, i) => ({ rid: `#1:${i}`, label }))
    expect(deskHint({ desks })).toBe('A, B +2')
  })

  it('identifies an ROI label by run and label, with an empty model when none', () => {
    const item = { service_id: 'md-gliner2', task: 'extract', label: 'person', count: 3 }
    expect(roiCriterion(item)).toEqual({
      service_id: 'md-gliner2',
      task: 'extract',
      model: '',
      label: 'person',
    })
    expect(roiKey(item)).toBe('md-gliner2|extract||person')
    expect(roiKey({ ...item, model: 'big' })).not.toBe(roiKey(item))
  })

  it('tells who tagged, and nothing for machine-only tags', () => {
    expect(taggedByText({ tagged_by: [{ rid: '#5:1', name: 'Ann' }, { rid: '#5:2' }] })).toBe(
      'Tagged by Ann, #5:2',
    )
    expect(taggedByText({ tagged_by: [] })).toBe('')
    expect(taggedByText({})).toBe('')
  })
})
