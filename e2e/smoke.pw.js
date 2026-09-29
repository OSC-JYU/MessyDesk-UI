import { test, expect } from '@playwright/test'

// Opens every route and saves a screenshot at 1440 px and 1024 px wide into
// e2e/screenshots/<SHOT_LABEL>/. Compare two labels (e.g. "before" and
// "after") side by side when a stage changes how screens look.
const label = process.env.SHOT_LABEL || 'current'
const widths = [1440, 1024]

const staticRoutes = [
  ['home', '/'],
  ['search', '/search'],
  ['entities', '/entities'],
  ['services', '/services'],
  ['services-admin', '/services/admin'],
  ['prompts', '/prompts'],
  ['admin', '/admin'],
  ['help', '/help'],
  ['intro', '/intro'],
  ['about', '/about'],
  ['crunchers', '/crunchers'],
  ['login', '/login'],
]

async function firstProjectRid(request) {
  const res = await request.get('/api/projects')
  const projects = await res.json()
  return projects.length ? projects[0]['@rid'].replace('#', '') : null
}

async function shoot(page, name) {
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 })
    await page.waitForTimeout(400)
    await page.screenshot({ path: `e2e/screenshots/${label}/${name}-${width}.png` })
  }
}

async function open(page, path) {
  const errors = []
  page.on('pageerror', (err) => errors.push(err.message))
  await page.goto(path)
  await page.waitForLoadState('networkidle').catch(() => {})
  await expect(page.locator('.v-application')).toBeVisible()
  return errors
}

for (const [name, path] of staticRoutes) {
  test(`route ${name} opens`, async ({ page }) => {
    const errors = await open(page, path)
    await shoot(page, name)
    expect(errors, errors.join('\n')).toEqual([])
  })
}

test('project routes open', async ({ page, request }) => {
  const rid = await firstProjectRid(request)
  test.skip(!rid, 'backend has no projects')

  let fileRid = null
  for (const [name, sub] of [
    ['project-graph', ''],
    ['project-search', '/search'],
    ['project-entities', '/entities'],
  ]) {
    const errors = await open(page, `/project/${rid}${sub}`)
    await shoot(page, name)
    expect(errors, `${name}: ${errors.join('\n')}`).toEqual([])
    if (!sub) {
      // Remember a file node from the graph so the file viewer can be opened too.
      const node = page
        .locator('.vue-flow__node-text, .vue-flow__node-image, .vue-flow__node-pdf')
        .first()
      fileRid = (await node.count()) ? (await node.getAttribute('data-id')).replace('#', '') : null
    }
  }

  if (fileRid) {
    const errors = await open(page, `/project/${rid}/file/${fileRid}`)
    await shoot(page, 'project-file')
    expect(errors, errors.join('\n')).toEqual([])
  }
})

test('node delete asks for confirmation and can be cancelled', async ({ page, request }) => {
  const rid = await firstProjectRid(request)
  test.skip(!rid, 'backend has no projects')
  await open(page, `/project/${rid}`)

  const node = page
    .locator('.vue-flow__node-text, .vue-flow__node-image, .vue-flow__node-pdf')
    .first()
  test.skip(!(await node.count()), 'project has no file nodes')
  await node.click()
  await page.getByTitle('delete item').click()

  const dialog = page.getByRole('alertdialog', { name: 'Delete node' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('also deletes all of its child nodes')
  await page.waitForTimeout(400) // let the open transition finish
  await page.screenshot({ path: `e2e/screenshots/${label}/node-delete-dialog-1440.png` })

  // Cancel only: this test never deletes anything.
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()
  await expect(node).toBeVisible()
})
