import { afterEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import { onAuthError } from '@/api/client.js'

// The response interceptor client.js installs on the shared Axios instance.
const rejected = axios.interceptors.response.handlers.at(-1).rejected
const fail = (status) => rejected({ response: { status, data: {} } })

describe('api client', () => {
  afterEach(() => onAuthError(null))

  it('reports 401 and 302 responses to the auth handler', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const handler = vi.fn()
    onAuthError(handler)
    await expect(fail(401)).rejects.toMatchObject({ status: 401 })
    await expect(fail(302)).rejects.toMatchObject({ status: 302 })
    await expect(fail(500)).rejects.toMatchObject({ status: 500 })
    expect(handler.mock.calls).toEqual([[401], [302]])
  })

  it('turns a missing response into status 0', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(rejected({ request: {} })).rejects.toMatchObject({ status: 0 })
  })
})
