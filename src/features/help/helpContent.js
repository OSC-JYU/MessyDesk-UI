import DOMPurify from 'dompurify'

// The backend serves help pages as whole HTML documents with their own
// navigation and stylesheet. This picks out the navigation links and the
// article, sanitises the article and points its asset URLs at the API, so the
// page can be shown with the app's own styles.

function withApiBase(pathname) {
  const base = String(import.meta.env.VITE_API_PATH || '').replace(/\/$/, '')
  return `${base}${pathname}`
}

export function resolveAssetUrls(html) {
  if (!html) return ''
  return html
    .replace(
      /(["'])\/api\/help\/images\/([^"']+)\1/g,
      (match, quote, path) =>
        `${quote}${withApiBase(`/api/help/images/${path.replace(/^\/+/, '')}`)}${quote}`,
    )
    .replace(
      /(["'])\/api\/services\/([^"']+)\1/g,
      (match, quote, path) =>
        `${quote}${withApiBase(`/api/services/${path.replace(/^\/+/, '')}`)}${quote}`,
    )
}

export function parseHelpPage(rawHtml) {
  const doc = new DOMParser().parseFromString(resolveAssetUrls(rawHtml), 'text/html')

  const nav = [...doc.querySelectorAll('nav.help-nav a')].map((link) => ({
    label: link.textContent.trim(),
    href: link.getAttribute('href') || '',
    active: link.classList.contains('active'),
  }))

  const article = doc.querySelector('article.content') || doc.querySelector('main') || doc.body
  doc.querySelectorAll('nav.help-nav').forEach((node) => node.remove())
  const title = doc.querySelector('title')?.textContent?.replace(/^MessyDesk Help - /, '') || ''

  return {
    nav,
    title,
    html: DOMPurify.sanitize(article.innerHTML, { FORBID_TAGS: ['style', 'link', 'script'] }),
  }
}

// Help pages link to each other with site-relative ("/help/tools") and
// page-relative ("help/principles") hrefs. Returns the in-app path for a help
// link, or null for any other link.
export function helpPath(href) {
  if (!href) return null
  const path = href.startsWith('/') ? href : `/${href}`
  return path === '/help' || path.startsWith('/help/') ? path : null
}
