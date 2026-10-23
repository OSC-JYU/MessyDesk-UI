import { describe, expect, it } from 'vitest'
import {
  actionText,
  defaultType,
  otherDesks,
  showCreators,
  typeDeleteBlock,
} from '@/features/tags/tagAdmin.js'

const usage = {
  rid: '#30:1',
  label: 'urgent',
  files: 7,
  desks: [
    { rid: '#12:3', label: 'Archive', files: 4 },
    { rid: '#12:4', label: 'Letters', files: 3 },
  ],
}

describe('showCreators', () => {
  it('hides the column when the signed-in user made every tag', () => {
    const items = [{ creator: { rid: '#5:1', name: 'Ann' } }, { creator: null }]
    expect(showCreators(items, '#5:1')).toBe(false)
    expect(showCreators(items, '5:1')).toBe(false)
  })

  it('shows it when someone else made a tag', () => {
    expect(showCreators([{ creator: { rid: '#5:2', name: 'Bob' } }], '#5:1')).toBe(true)
    expect(showCreators([], '#5:1')).toBe(false)
  })
})

describe('otherDesks', () => {
  it('leaves out the current desk', () => {
    expect(otherDesks(usage, '12:3').map((d) => d.label)).toEqual(['Letters'])
    expect(otherDesks(usage, '').length).toBe(2)
  })
})

describe('actionText', () => {
  it('warns that renaming changes the tag in the other desks', () => {
    const text = actionText('rename', { label: 'urgent' }, usage, '#12:3')
    expect(text.lines.join(' ')).toContain('7 files')
    expect(text.lines.join(' ')).toContain('every desk that has it')
    expect(text.lines.join(' ')).toContain('Letters (3 files)')
    expect(text.lines.join(' ')).not.toContain('Archive')
    expect(text.danger).toBe(false)
  })

  it('says how many files lose the tag when it is removed from this desk', () => {
    const text = actionText('remove', { label: 'urgent' }, usage, '#12:3')
    expect(text.lines[0]).toContain('4 files of this desk')
    expect(text.lines[1]).toContain('stays in: Letters')
    expect(text.danger).toBe(true)
  })

  it('says the tag itself goes when no other desk has it', () => {
    const only = { ...usage, files: 4, desks: [usage.desks[0]] }
    const text = actionText('remove', { label: 'urgent' }, only, '#12:3')
    expect(text.lines[1]).toContain('the tag itself is deleted')
  })

  it('warns that delete everywhere cannot be undone and lists every desk', () => {
    const text = actionText('delete', { label: 'urgent' }, usage, '')
    expect(text.title).toBe('Delete tag everywhere')
    expect(text.lines[0]).toContain('Archive (4 files), Letters (3 files)')
    expect(text.lines.at(-1)).toBe('This cannot be undone.')
    expect(text.confirmText).toBe('Delete everywhere')
  })
})

describe('typeDeleteBlock', () => {
  it('explains why a type cannot be deleted', () => {
    expect(typeDeleteBlock({ type: 'Tag', protected: true, count: 0 })).toBe('Used by machine tags')
    expect(typeDeleteBlock({ type: 'Person', count: 3 })).toBe('Delete its 3 tags first')
    expect(typeDeleteBlock({ type: 'Person', count: 1 })).toBe('Delete its 1 tag first')
  })

  it('allows an empty type', () => {
    expect(typeDeleteBlock({ type: 'Mood', count: 0 })).toBe('')
    expect(typeDeleteBlock({ type: 'Mood' })).toBe('')
  })
})

describe('defaultType', () => {
  it('prefers Tag, then the first type, then nothing', () => {
    expect(defaultType([{ type: 'Person' }, { type: 'Tag' }])).toBe('Tag')
    expect(defaultType([{ type: 'Person' }, { type: 'Place' }])).toBe('Person')
    expect(defaultType([])).toBeNull()
    expect(defaultType(undefined)).toBeNull()
  })
})
