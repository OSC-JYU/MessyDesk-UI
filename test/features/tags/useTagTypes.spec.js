import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/entities.js', () => ({
  getEntityTypes: vi.fn(),
  createEntityType: vi.fn(),
  deleteEntityType: vi.fn(),
}))

const api = await import('@/api/entities.js')
const { useTagTypes } = await import('@/features/tags/useTagTypes.js')

const types = [
  { type: 'Tag', label: 'Tag', count: 5, protected: true },
  { type: 'Mood', label: 'Mood', count: 0 },
]

beforeEach(() => {
  vi.clearAllMocks()
  api.getEntityTypes.mockResolvedValue(types)
})

describe('useTagTypes', () => {
  it('loads the types with counts', async () => {
    const { state, load } = useTagTypes()
    await load()
    expect(api.getEntityTypes).toHaveBeenCalledWith({ counts: true })
    expect(state.types).toEqual(types)
  })

  it('keeps a load error', async () => {
    api.getEntityTypes.mockRejectedValue({ status: 500, message: 'down' })
    const { state, load } = useTagTypes()
    await load()
    expect(state.error.message).toBe('down')
    expect(state.loading).toBe(false)
  })

  it('adds a trimmed type with a colour, reloads and notifies', async () => {
    api.createEntityType.mockResolvedValue({})
    const changed = vi.fn()
    const { state, add } = useTagTypes(changed)
    state.name = '  Mood '
    state.color = '#112233'
    await add()
    expect(api.createEntityType).toHaveBeenCalledWith('Mood', '#112233')
    expect(state.name).toBe('')
    expect(api.getEntityTypes).toHaveBeenCalledTimes(1)
    expect(changed).toHaveBeenCalled()
  })

  it('does not add an empty name', async () => {
    const { state, add } = useTagTypes()
    state.name = '   '
    await add()
    expect(api.createEntityType).not.toHaveBeenCalled()
  })

  it('shows the 409 and 400 messages and keeps the name', async () => {
    const changed = vi.fn()
    const { state, add } = useTagTypes(changed)
    state.name = 'tag'
    api.createEntityType.mockRejectedValueOnce({ status: 409, message: 'Type exists' })
    await add()
    expect(state.addError.message).toBe('Type exists')
    expect(state.name).toBe('tag')
    api.createEntityType.mockRejectedValueOnce({ status: 400, message: 'Invalid name' })
    await add()
    expect(state.addError.message).toBe('Invalid name')
    expect(changed).not.toHaveBeenCalled()
    expect(state.adding).toBe(false)
  })

  it('deletes after confirmation, reloads and notifies', async () => {
    api.deleteEntityType.mockResolvedValue({ deleted: true })
    const changed = vi.fn()
    const { state, askDelete, confirmDelete } = useTagTypes(changed)
    askDelete(types[1])
    expect(state.confirm).toMatchObject({ open: true, type: types[1] })
    await confirmDelete()
    expect(api.deleteEntityType).toHaveBeenCalledWith('Mood')
    expect(state.confirm.open).toBe(false)
    expect(changed).toHaveBeenCalled()
  })

  it('keeps the confirmation open and shows the 409 when the type still has tags', async () => {
    api.deleteEntityType.mockRejectedValue({ status: 409, message: 'The type has 2 tags' })
    const { state, askDelete, confirmDelete } = useTagTypes()
    askDelete(types[1])
    await confirmDelete()
    expect(state.confirm.open).toBe(true)
    expect(state.confirm.error.message).toBe('The type has 2 tags')
    expect(state.confirm.pending).toBe(false)
  })
})
