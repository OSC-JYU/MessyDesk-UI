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
| UI framework | Vuetify 3 | ^3.5.17 |
| Graph visualization | @vue-flow/core + dagre | ^1.33.5 / ^0.8.5 |
| HTTP client | Axios | ^1.7.2 |
| i18n | vue-i18n | ^9.2.2 |
| Markdown | marked + DOMPurify | ^18.0.4 / ^3.4.7 |
| Test runner | Vitest + jsdom + @vue/test-utils; Playwright route smoke tests | ^4.1.7 |
| Lint / format | ESLint (flat config, eslint-plugin-vue) + Prettier | — |

**Verified from:** `package.json`

## High-Level Module Map

```
src/
├── app/        main.js (bootstrap), router.js, App.vue (auth handler, SSE, jobs panel),
│               AppShell.vue + AppHeader.vue, vuetify.js, i18n.js
├── styles/     tokens.css (Fjord light/dark), reset.css, fonts.css, vuetify-theme.js
├── api/        client.js (Axios) + area modules (projects, files, services, search, entities, admin, session)
├── stores/     session, ui, fileBrowse, pageMemory, batchStore
├── ui/         shared UI kit
├── features/   home, project (desk graph), files (viewer), search, tags, services, admin, help, jobs
└── services/   events.js (single SSE connection)
```

## Architectural Decisions

### 1. Small Stores, No Global Store

State lives in small reactive modules in `src/stores/`, and the state of one desk in a workspace shared with provide/inject (`features/project/useWorkspace.js`). See [state-management.md](state-management.md).

**Verified from:** `src/stores/`

### 2. One UI Framework (Vuetify)

Vuetify 3 is the only component library; icons are Material Design Icons (`mdi-*`). Colours and spacing come from `src/styles/tokens.css` and the Vuetify theme (`src/styles/vuetify-theme.js`). Bootstrap was removed in stage 8.

**Verified from:** `src/app/main.js` (imports), `package.json`

### 3. Server-Sent Events (SSE) Instead of WebSockets

Real-time updates (node additions, process progress) arrive via SSE at `{apiUrl}/events`. A single connection is managed by `src/services/events.js`, opened once on app mount in `src/app/App.vue`. It auto-reconnects with 5-second delay on error and hydrates batch state on reconnect.

Components receive events via:
- `batchStore` — batch/process events are routed directly to the reactive store
- `window` custom event `md-sse` — graph events (add, update) are applied by `features/project/useDeskGraph.js`

**Verified from:** `src/services/events.js`, `src/app/App.vue`

### 4. Dagre for Graph Layout

Node positions are computed by the `dagre` library by `layoutLeftToRight` in `graphModel.js`. Fixed node dimensions (200×200) are used regardless of actual rendered size. Direction defaults to `LR` (left-to-right).

**Verified from:** `src/features/project/graphModel.js` (`layoutLeftToRight`)

### 5. File Type Dispatch Pattern

File display uses a two-level lookup: first by `file.type` (backend-assigned semantic type like `image`, `ocr.json`, `ner.json`), then by `file.extension` as fallback. The mapping is `displayFor` in `src/features/files/fileTypes.js`.

**Verified from:** `src/features/files/fileTypes.js` (`displayFor`); see [file-display-system.md](file-display-system.md)

## Environment Configuration

| Variable | Purpose | Used in |
|----------|---------|---------|
| `VITE_PUBLIC_PATH` | Base path for router history and static assets | `main.js`, `vite.config.js` |
| `VITE_API_PATH` | Axios `baseURL` for all API requests | `api/client.js` |
| `VITE_FALLBACK_LOCALE` | i18n fallback locale | `main.js` |

**Verified from:** `src/app/main.js`, `src/api/client.js`, `vite.config.js`

## Dev Server Proxy

In development, Vite proxies four path prefixes to the backend at `localhost:8200`:

- `/api` — REST API
- `/events` — SSE stream (with keep-alive headers)
- `/images` — Served file images/thumbnails
- `/icons` — UI icons served by backend

**Verified from:** `vite.config.js`
