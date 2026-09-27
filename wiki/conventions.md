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

**Verified from:** `GraphDisplay.vue`, `FileDisplayWrapper.vue`, `SearchMain.vue`

### Global Store Import
```js
import { store } from './Store.js'   // relative path varies
```
Used in nearly every component. Mutations are direct property assignments.

### API Access
```js
import web from '../web.js'
```
All API calls go through `web.*` methods. No direct `axios` usage in components (with one exception: `ServicesMain.vue` imports `axios` directly for queue loading).

**Verified from:** all component files

### Event Communication
- Parent↔child: Vue `defineEmits` + `$emit` (standard)
- Cross-component: Direct store mutation (not event bus)
- Backend→frontend: SSE in `GraphDisplay.vue`

## Naming Conventions

| Convention | Example | Note |
|-----------|---------|------|
| Component files | PascalCase `.vue` | `GraphDisplay.vue`, `SetPanel.vue` |
| JS modules | camelCase `.js` | `useLayout.js`, `web.js` |
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

**Verified from:** `Login.vue`, `Main.vue`, `FileDisplayWrapper.vue`

## i18n Usage

Internationalization is configured with `vue-i18n` (legacy mode disabled, global injection enabled). Locale defaults to `fi` (Finnish), with `en` as fallback. However, most UI text is hardcoded in English directly in templates. i18n is only used in a few places (login page, navigation labels).

**Verified from:** `src/main.js` (i18n config), `lang/messages.json`, templates

## Testing

The test suite uses Vitest with jsdom environment. Test coverage is minimal—only one test file exists:

- `test/components/displays/VersionTools.spec.js` — Tests the VersionTools component in isolation using Vuetify component stubs

Test patterns:
- Mount with stubs for Vuetify components
- Assert rendered text and emitted events
- No integration tests or API mocking infrastructure

**Verified from:** `package.json` (test config), `test/` directory, `VersionTools.spec.js`

## CSS Organization

- `src/assets/base.css` — Global base styles (imported in `App.vue`)
- `src/assets/editor.css` — Editor-specific styles
- `src/components/displays/*.css` — Display-specific styles (imported as modules)
- Component-scoped `<style scoped>` blocks
- Many components use unscoped `<style>` (global CSS leakage risk)

**Verified from:** file structure, component style blocks

## Environment-Specific Behavior

The vite config supports multiple modes via `.env` files. The dev proxy maps four prefixes to `localhost:8200`. In production, `VITE_PUBLIC_PATH` sets the base URL for both the router and static assets.

**Verified from:** `vite.config.js`
