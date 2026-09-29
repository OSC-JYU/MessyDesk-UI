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
  // The floating batch panel (shown while jobs run) can cover buttons.
  await page.addStyleTag({ content: '.batch-progress-panel { display: none !important; }' })
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

test('help topics navigate inside the app', async ({ page }) => {
  await open(page, '/help')
  await expect(page.getByRole('heading', { level: 1, name: 'Help and tutorials' })).toBeVisible()
  await page.getByRole('navigation', { name: 'Help topics' }).getByText('Tools').click()
  await expect(page).toHaveURL(/\/help\/tools$/)
  await expect(page.locator('.help-article h2').first()).toBeVisible()
  // The backend's own help stylesheet must not leak into the app.
  expect(await page.locator('link[href*="help.css"]').count()).toBe(0)
})

test('introduction steps forward and back', async ({ page }) => {
  await open(page, '/intro')
  await expect(page.getByRole('heading', { name: '1. What is MessyDesk?' })).toBeVisible()
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByRole('heading', { name: '2. Design' })).toBeVisible()
  await page.getByRole('button', { name: 'Previous' }).click()
  await expect(page.getByRole('heading', { name: '1. What is MessyDesk?' })).toBeVisible()
})

test('login page shows the SSO identity and the request button', async ({ page }) => {
  // A registered user is sent from /login to the home page, so answer the
  // session ping as for someone signed in through SSO without an account.
  await page.route(/\/api$/, (route) => route.fulfill({ status: 401, body: 'Unauthorized' }))
  await open(page, '/login')
  await page.screenshot({ path: `e2e/screenshots/${label}/login-unregistered-1440.png` })
  await expect(page.locator('.v-app-bar')).toHaveCount(0)
  await expect(page.getByText('local.user@localhost')).toBeVisible()
  // Not clicked: sending would create a permission request in the backend.
  await expect(page.locator('.login-card .v-btn')).toBeVisible()
})

test('home lists desks, sorts them and opens one', async ({ page }) => {
  await open(page, '/')
  const table = page.locator('.desk-table')
  await expect(table).toBeVisible()
  const nameHeader = table.getByRole('columnheader', { name: /Desk/ })
  await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')
  await nameHeader.getByRole('button').click()
  await expect(nameHeader).toHaveAttribute('aria-sort', 'descending')
  await table.getByRole('columnheader', { name: /Items/ }).getByRole('button').click()
  await expect(table.getByRole('columnheader', { name: /Items/ })).toHaveAttribute('aria-sort', 'ascending')

  const firstDesk = table.locator('tbody tr').first().getByRole('link')
  await firstDesk.click()
  await expect(page).toHaveURL(/\/project\//)
})

test('desk dialogs open and cancel without changing anything', async ({ page }) => {
  await open(page, '/')
  const row = page.locator('.desk-table tbody tr').first()
  const deskName = (await row.getByRole('link').textContent()).trim()

  for (const [item, title] of [
    ['Rename desk', 'Rename desk'],
    ['Re-index search', 'Re-index search'],
    ['Delete desk', 'Delete desk'],
  ]) {
    await row.getByRole('button', { name: `Actions for ${deskName}` }).click()
    await page.locator('.v-overlay--active .v-list-item', { hasText: item }).click()
    const dialog = page.locator('.v-overlay--active .v-card').filter({ hasText: title })
    await expect(dialog).toBeVisible()
    if (item === 'Delete desk') {
      await expect(dialog.getByRole('button', { name: 'Delete desk' })).toBeDisabled()
      await page.waitForTimeout(400)
      await page.screenshot({ path: `e2e/screenshots/${label}/home-delete-dialog-1440.png` })
    }
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toBeHidden()
  }
})

// Creates, renames and deletes a throwaway desk. Writes to the backend, so it
// only runs with E2E_WRITE=1.
test('desk lifecycle: create, rename, delete', async ({ page }) => {
  test.skip(!process.env.E2E_WRITE, 'set E2E_WRITE=1 to run tests that change backend data')
  const name = `e2e desk ${Date.now()}`
  const renamed = `${name} renamed`

  await open(page, '/')
  await page.getByLabel('Desk name').fill(name)
  await page.getByRole('button', { name: 'Create desk' }).click()
  await expect(page).toHaveURL(/\/project\//)

  await open(page, '/')
  const row = page.locator('.desk-table tbody tr', { hasText: name })
  await row.getByRole('button', { name: `Actions for ${name}` }).click()
  await page.locator('.v-overlay--active .v-list-item', { hasText: 'Rename desk' }).click()
  const renameDialog = page.locator('.v-overlay--active .v-card').filter({ hasText: 'Rename desk' })
  await renameDialog.getByLabel('Desk name').fill(renamed)
  await renameDialog.getByRole('button', { name: 'Save' }).click()
  await expect(page.locator('.desk-table').getByRole('link', { name: renamed })).toBeVisible()

  const renamedRow = page.locator('.desk-table tbody tr', { hasText: renamed })
  await renamedRow.getByRole('button', { name: `Actions for ${renamed}` }).click()
  await page.locator('.v-overlay--active .v-list-item', { hasText: 'Delete desk' }).click()
  const deleteDialog = page.locator('.v-overlay--active .v-card').filter({ hasText: 'Delete desk' })
  await deleteDialog.getByLabel('Type the desk name to confirm').fill(renamed)
  await deleteDialog.getByRole('button', { name: 'Delete desk' }).click()
  await expect(page.locator('.desk-table').getByRole('link', { name: renamed })).toHaveCount(0)
})
