# Conventions & Patterns

## Component Patterns

### Composition API Everywhere
All components use `<script setup>` (Vue 3 Composition API). No Options API components exist.

**Verified from:** All inspected `.vue` files

### Reactive State Pattern
Components declare local state as:
```js
var state = reactive({ ... })
```
No `ref()` for complex state objects. `ref()` is used for single primitive values (e.g., pagination `page`, boolean flags).

**Verified from:** `src/features/`

### Stores
Small stores in `src/stores/` (`session`, `ui`, `fileBrowse`, `pageMemory`, `batchStore`); state of one desk is shared through `useWorkspace()` (provide/inject). The old global store is gone.

### API Access
```js
import { getProject } from '@/api/projects.js'
```
Code calls the `src/api/*` modules, which wrap the Axios client in `src/api/client.js`. No component uses `axios` or `client.js` directly.

**Verified from:** all component files

### Event Communication
- Parent↔child: Vue `defineEmits` + `$emit` (standard)
- Cross-component: Direct store mutation (not event bus)
- Backend→frontend: SSE via `services/events.js` (`md-sse` window events, read in `features/project/useDeskGraph.js`)

## Naming Conventions

| Convention | Example | Note |
|-----------|---------|------|
| Component files | PascalCase `.vue` | `GraphCanvas.vue`, `SetBrowser.vue` |
| JS modules | camelCase `.js` | `useWorkspace.js`, `graphModel.js` |
| Store property | snake_case | `current_node`, `file_browse_context` |
| API methods | camelCase | `web.getNodeFile()` |
| Route names | kebab-case | `project-graph`, `service-help` |
| CSS classes | kebab-case | `set-panel-toolbar` |
| Node types (graph) | kebab-case or dot-notation | `search-set`, `ocr.json` |

**Verified from:** source code inspection

## Error Display Pattern

There is no global error notification system. Errors are handled locally per component:
- `state.error` strings displayed in `v-alert` components
- `console.error()` for developer debugging
- Some methods silently swallow errors (e.g., ROI resolution fallbacks)

**Verified from:** old components. New screens use `ui/ErrorAlert.vue`.

## i18n Usage

Internationalization is configured with `vue-i18n` (legacy mode disabled, global injection enabled). Locale defaults to `fi` (Finnish), with `en` as fallback. However, most UI text is hardcoded in English directly in templates. i18n is only used in a few places (login page, navigation labels).

**Verified from:** `src/app/main.js` (i18n config), `lang/messages.json`, templates

## Testing

The test suite uses Vitest with jsdom environment. Test coverage is minimal—only one test file exists:

- `test/` mirrors `src/` (`test/ui`, `test/features/…`, `test/stores`); Vuetify is installed for every test in `test/setup.js`

Test patterns:
- Mount with stubs for Vuetify components
- Assert rendered text and emitted events
- No integration tests or API mocking infrastructure

**Verified from:** `package.json` (test config), `test/` directory, `VersionTools.spec.js`

## CSS Organization

- `src/styles/tokens.css` — design tokens (colour, type, spacing, radius, shadow); the only place hex values live, together with `src/styles/vuetify-theme.js`
- `src/styles/reset.css` — global reset and base typography (IBM Plex Sans body, IBM Plex Mono for code, Junicode titles; fonts in `src/styles/fonts.css`)
- `src/features/project/graph.css` — Vue Flow styles inside the desk
- Component-scoped `<style scoped>` blocks
- Many old components use unscoped `<style>` (global CSS leakage risk)

New code follows the style rules in [rewrite.md](rewrite.md); `npm run lint` checks them.

**Verified from:** file structure, component style blocks

## Environment-Specific Behavior

The vite config supports multiple modes via `.env` files. The dev proxy maps four prefixes to `localhost:8200`. In production, `VITE_PUBLIC_PATH` sets the base URL for both the router and static assets.

**Verified from:** `vite.config.js`
