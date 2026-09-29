# MessyDesk-UI Architecture

## Overview

MessyDesk-UI is a Vue 3 single-page application that serves as the frontend for the MessyDesk digital humanities platform. It provides a graph-based project workspace where users manage files, run processing services ("crunchers"), and browse results.

**Verified from source:** `package.json`, `src/app/main.js`, `vite.config.js`

## Technology Stack

| Layer | Technology | Version constraint |
|-------|-----------|-------------------|
| Framework | Vue 3 (Composition API, `<script setup>`) | ^3.2.31 |
| Build tool | Vite | ^6.0.7 |
| Router | vue-router | ^4.1.3 |
| State | Reactive singleton (no Vuex/Pinia) | — |
| UI framework | Vuetify 3 (Bootstrap 5 still loaded for old screens until stage 8) | ^3.5.17 / ^5.3.1 |
| Graph visualization | @vue-flow/core + dagre | ^1.33.5 / ^0.8.5 |
| HTTP client | Axios | ^1.7.2 |
| i18n | vue-i18n | ^9.2.2 |
| PDF rendering | vue-pdf-embed | ^2.0.4 |
| Markdown | marked + DOMPurify | ^18.0.4 / ^3.4.7 |
| Test runner | Vitest + jsdom + @vue/test-utils; Playwright route smoke tests | ^4.1.7 |
| Lint / format | ESLint (flat config, eslint-plugin-vue) + Prettier | — |

**Verified from:** `package.json`

## High-Level Module Map

```
src/
├── app/                 # New shell: main.js (bootstrap), router.js (route table, the old/new switch),
│                        # App.vue (session check, SSE connect, BatchProgressPanel), AppShell.vue +
│                        # AppHeader.vue (the one header), vuetify.js, i18n.js
├── styles/              # tokens.css, reset.css, vuetify-theme.js, legacy.css (old global rules)
├── api/                 # Area modules (projects, files, services, search, entities, admin, session);
│                        # thin wrappers over web.js for now
├── stores/              # session.js (signed-in user), ui.js (header/drawer state), batchStore.js
├── ui/                  # Shared UI kit (stage 1)
├── features/            # Rewritten screens by area (stages 2-7)
├── web.js               # Legacy Axios API client, emptied as callers move to api/
├── services/
│   └── events.js        # Single SSE connection manager (routes events to stores/DOM)
└── components/          # Old UI, replaced route by route (see rewrite.md)
    ├── Store.js         # Old global reactive store (store.user delegates to stores/session.js)
    ├── BatchProgressPanel.vue  # Floating batch progress panel (rendered in app/App.vue)
    ├── GraphMain.vue    # Project workspace: drawer + nested route views
    ├── ProjectDrawer.vue # Project side drawer, toggled from the app header
    ├── GraphDisplay.vue # Graph canvas (VueFlow) + set panel (listens md-sse events)
    ├── displays/        # File content viewers (type-dispatched)
    ├── nodes/           # Graph node renderers (per type)
    └── ...              # Dialogs, forms, lists
```

## Architectural Decisions

### 1. No Formal State Management Library

State lives in a single `reactive({})` object exported from `Store.js`. Components import it directly. There is no action/mutation/getter pattern. Any component can read or mutate `store.*` properties.

**Implication:** Changes propagate via Vue's reactivity system. There is no event log or devtools integration for state changes.

**Verified from:** `src/components/Store.js`

### 2. Dual CSS Framework (Vuetify + Bootstrap)

Both Vuetify 3 and Bootstrap 5 are loaded. Vuetify provides structural components (dialogs, app bars, expansion panels). Bootstrap provides utility classes and icons. They coexist via separate CSS imports in `src/app/main.js`. Bootstrap is being dropped: new code uses Vuetify only, and Bootstrap is removed with the last old screen.

**Verified from:** `src/app/main.js` (imports), `package.json`

### 3. Server-Sent Events (SSE) Instead of WebSockets

Real-time updates (node additions, process progress) arrive via SSE at `{apiUrl}/events`. A single connection is managed by `src/services/events.js`, opened once on app mount in `src/app/App.vue`. It auto-reconnects with 5-second delay on error and hydrates batch state on reconnect.

Components receive events via:
- `batchStore` — batch/process events are routed directly to the reactive store
- `window` custom event `md-sse` — graph-specific events (add, update) are dispatched for `GraphDisplay.vue`

**Verified from:** `src/services/events.js`, `src/app/App.vue`

### 4. Dagre for Graph Layout

Node positions are computed by the `dagre` library via the `useLayout` composable. Fixed node dimensions (200×200) are used regardless of actual rendered size. Direction defaults to `LR` (left-to-right).

**Verified from:** `src/components/useLayout.js`

### 5. File Type Dispatch Pattern

File display uses a two-level lookup: first by `file.type` (backend-assigned semantic type like `image`, `ocr.json`, `ner.json`), then by `file.extension` as fallback. The mapping is `displayFor` in `src/features/files/fileTypes.js`.

**Verified from:** `src/features/files/fileTypes.js` (`displayFor`); see [file-display-system.md](file-display-system.md)

## Environment Configuration

| Variable | Purpose | Used in |
|----------|---------|---------|
| `VITE_PUBLIC_PATH` | Base path for router history and static assets | `main.js`, `vite.config.js` |
| `VITE_API_PATH` | Axios `baseURL` for all API requests | `web.js` |
| `VITE_FALLBACK_LOCALE` | i18n fallback locale | `main.js` |

**Verified from:** `src/app/main.js`, `src/web.js`, `vite.config.js`

## Dev Server Proxy

In development, Vite proxies four path prefixes to the backend at `localhost:8200`:

- `/api` — REST API
- `/events` — SSE stream (with keep-alive headers)
- `/images` — Served file images/thumbnails
- `/icons` — UI icons served by backend

**Verified from:** `vite.config.js`
