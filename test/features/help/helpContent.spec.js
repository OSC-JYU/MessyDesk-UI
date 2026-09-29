import { describe, it, expect } from 'vitest'
import { helpPath, parseHelpPage } from '@/features/help/helpContent.js'

const page = `<!doctype html><html><head><title>MessyDesk Help - Tools</title>
<link rel="stylesheet" href="/api/help/styles/help.css" /></head><body><main class="page">
<nav class="help-nav"><a href="/help">Index</a><a class="active" href="/help/tools">Tools</a></nav>
<article class="content"><h2>Tools</h2><p>See <a href="help/principles">principles</a>.</p>
<p><img src="/api/help/images/nodes.jpg" alt="nodes"></p>
<script>alert(1)</script><p onclick="steal()">Click</p>
<div class="md-columns" style="--md-columns: 4;"><section class="md-column">A</section></div>
</article></main></body></html>`

describe('parseHelpPage', () => {
  const result = parseHelpPage(page)

  it('extracts the navigation links and marks the active one', () => {
    expect(result.nav).toEqual([
      { label: 'Index', href: '/help', active: false },
      { label: 'Tools', href: '/help/tools', active: true },
    ])
  })

  it('takes the title without the site prefix', () => {
    expect(result.title).toBe('Tools')
  })

  it('keeps the article and its layout blocks', () => {
    expect(result.html).toContain('<h2>Tools</h2>')
    expect(result.html).toContain('class="md-columns"')
    expect(result.html).toContain('--md-columns: 4')
    expect(result.html).not.toContain('help-nav')
  })

  it('drops scripts, event handlers and the backend stylesheet', () => {
    expect(result.html).not.toContain('<script')
    expect(result.html).not.toContain('onclick')
    expect(result.html).not.toContain('help.css')
  })

  it('keeps help image URLs pointing at the API', () => {
    expect(result.html).toContain('src="/api/help/images/nodes.jpg"')
  })
})

describe('helpPath', () => {
  it.each([
    ['/help', '/help'],
    ['/help/tools', '/help/tools'],
    ['help/principles', '/help/principles'],
    ['https://example.org', null],
    ['/services', null],
    ['', null],
  ])('%s → %s', (href, expected) => {
    expect(helpPath(href)).toBe(expected)
  })
})
