# MessyDesk-UI AI coding instructions

## Big picture
- Vue 3 + Vite single-page UI; routes are configured in [src/main.js](src/main.js) and mounted in [src/App.vue](src/App.vue).
- Global UI state lives in a reactive singleton store in [src/components/Store.js](src/components/Store.js); many components read/write `store` directly.
- API access is centralized in [src/web.js](src/web.js) using Axios with `VITE_API_PATH` as `baseURL` and a global error interceptor.
- Visual layout uses Vuetify 3 (see `createVuetify` in [src/main.js](src/main.js)) plus Bootstrap styles imported in [src/App.vue](src/App.vue).

## Data flow & integrations
- The UI talks to the MessyDesk backend over `/api` endpoints defined in [src/web.js](src/web.js); functions usually return `result.data`.
- Dev server proxies `/api`, `/events`, `/images`, `/icons` to the backend at :8200; see [vite.config.js](vite.config.js).
- Language strings are in [lang/messages.json](lang/messages.json); `createI18n` defaults to locale `fi` with fallback from `VITE_FALLBACK_LOCALE` in [src/main.js](src/main.js).

## Project-specific patterns
- Route-driven views map to “main” components (Project, Graph, Files, Services, Crunchers, etc.) in [src/main.js](src/main.js).
- Graph/file displays are type-based: [src/components/GraphMain.vue](src/components/GraphMain.vue) selects display components by `store.file.type`/`extension` (e.g., `OCRDisplay`, `NER_Display`, `JSONDisplay`).
- Node renderers for the graph live under [src/components/nodes/](src/components/nodes/) and are selected by node type elsewhere.
- Error handling in API calls expects `error.status`/`error.message` from the Axios interceptor in [src/web.js](src/web.js).

## Dev workflows
- Install and run: `npm install`, `npm run dev` (Vite on port 3000). See [README.md](README.md).
- Production build: `npm run build`; preview with `npm run preview --port 5050` (see [package.json](package.json)).
- Configure `.env` to set `VITE_PUBLIC_PATH` and `VITE_API_PATH` (not committed; referenced in [README.md](README.md) and [vite.config.js](vite.config.js)).
