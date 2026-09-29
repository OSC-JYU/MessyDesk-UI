// Style gate for the rewrite: new code (everything outside src/components/ and
// src/web.js) may not use hex colours, inline style attributes or Bootstrap
// classes. Colours live in src/styles/tokens.css and src/styles/vuetify-theme.js.
import fs from 'node:fs'
import path from 'node:path'

const roots = ['src/app', 'src/ui', 'src/features', 'src/api', 'src/stores', 'src/styles']
const colourFiles = new Set(['src/styles/tokens.css', 'src/styles/vuetify-theme.js'])
const legacyFiles = new Set(['src/styles/legacy.css'])

const bootstrapClass =
  /^(row|container(-fluid)?|col(-(sm|md|lg|xl|xxl))?-\d+|btn(-[\w-]+)?|form-(control|select|check|label)|card-(body|header|footer|title|text)|navbar[\w-]*|dropdown-[\w-]+|bi|bi-[\w-]+|[mp]-\d|justify-content-[\w-]+|align-items-[\w-]+|vh-100|list-group[\w-]*)$/

const checks = [
  { name: 'hex colour', test: (line) => /#[0-9a-fA-F]{3,8}\b/.test(line), skip: colourFiles },
  { name: 'inline style attribute', test: (line) => /\sstyle="/.test(line) },
  {
    name: 'Bootstrap class',
    test: (line) =>
      [...line.matchAll(/\sclass="([^"]*)"/g)].some((m) =>
        m[1].split(/\s+/).some((c) => bootstrapClass.test(c)),
      ),
  },
]

function* walk(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else if (/\.(vue|js|css)$/.test(entry.name)) yield full
  }
}

let failures = 0
for (const root of roots) {
  for (const file of walk(root)) {
    if (legacyFiles.has(file)) continue
    fs.readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        for (const check of checks) {
          if (check.skip?.has(file)) continue
          if (check.test(line)) {
            failures++
            console.log(`${file}:${i + 1}: ${check.name}: ${line.trim()}`)
          }
        }
      })
  }
}

if (failures) {
  console.log(`\n${failures} style problem(s) in new code.`)
  process.exit(1)
}
console.log('New code style check passed.')
