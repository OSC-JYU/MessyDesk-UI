import { test, expect } from '@playwright/test'

// Live desk updates from server events, against a mocked API so no backend
// data is needed. Events are dispatched the way services/events.js does.
const graph = {
  nodes: [
    { data: { id: '#10:0', type: 'text', _type: 'file', label: 'notes.txt' } },
    { data: { id: '#10:1', type: 'set', _type: 'set', label: 'Letters', count: 2 } },
  ],
  edges: [],
}

test.beforeEach(async ({ page }) => {
  await page.route(
    (url) => url.pathname.startsWith('/api/'),
    (route) => {
      const path = new URL(route.request().url()).pathname
      if (path === '/api/projects/1:0') return route.fulfill({ json: graph })
      if (path === '/api/me') return route.fulfill({ json: { rid: '#1:0', access: 'user' } })
      return route.fulfill({ json: {} })
    },
  )
  await page.route(
    (url) => url.pathname === '/events',
    (route) => route.abort(),
  )
  await page.goto('/project/1:0')
  await expect(page.locator('.vue-flow__node')).toHaveCount(2)
})

const send = (page, detail) =>
  page.evaluate((d) => window.dispatchEvent(new CustomEvent('md-sse', { detail: d })), detail)

test('a cruncher and its result are connected as they arrive', async ({ page }) => {
  const warnings = []
  page.on('console', (m) => /Edge source or target is missing/.test(m.text()) && warnings.push(m))
  const edges = page.locator('.vue-flow__edge')

  await send(page, {
    command: 'add',
    type: 'process',
    input: '#10:0',
    node: { '@rid': '#20:0', '@type': 'Process', label: 'Tesseract' },
  })
  await expect(edges).toHaveCount(1)

  await send(page, {
    command: 'add',
    type: 'text',
    input: '#20:0',
    node: { '@rid': '#21:0', '@type': 'File', label: 'result.txt' },
  })
  await expect(edges).toHaveCount(2)
  expect(warnings).toHaveLength(0)
})

test('a batch run is connected to its set and to its output set', async ({ page }) => {
  await send(page, {
    command: 'add',
    type: 'process',
    input: '#10:1',
    node: { '@rid': '#30:0', '@type': 'SetProcess', label: 'Batch OCR' },
    output: { '@rid': '#31:0', '@type': 'Set', type: 'set', label: 'OCR results' },
  })
  await expect(page.locator('.vue-flow__node')).toHaveCount(4)
  await expect(page.locator('.vue-flow__edge')).toHaveCount(2)
})
