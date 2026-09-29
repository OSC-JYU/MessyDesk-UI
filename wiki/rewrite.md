# UI rewrite

The UI is being rewritten route by route in this repository. The full plan (stages, checks, open
questions) is the "MessyDesk UI rewrite plan" document; this page records what the code does.

## Target structure

```
src/
  app/        main.js, router.js, App.vue, AppShell.vue, AppHeader.vue
  styles/     tokens.css, reset.css, vuetify-theme.js (+ legacy.css until the old screens are gone)
  api/        one module per backend area
  stores/     one small store per area
  ui/         shared building blocks (stage 1)
  features/   home, project, files, search, services, admin, help
```

## How old and new code live together

- **The router is the switch.** Each route in `src/app/router.js` points at its old view until
  the new one is ready. Routes still served by old views carry `meta.legacy: true`. The old file is
  deleted in the same change that switches the route.
- **One direction.** New code may not import from `src/components/`. ESLint enforces this
  (`no-restricted-imports` for static imports, `no-restricted-syntax` for `import()`). The router and
  `App.vue` (for `BatchProgressPanel`) are the only allowed exceptions, marked with
  `eslint-disable` comments. Old code may import new stores and API modules.
- **One header.** `AppShell` renders `AppHeader` and the main area for every route except
  `meta.shell: false` (login). The project drawer lives in the project workspace
  (`components/ProjectDrawer.vue`) and is toggled through `stores/ui.js`; `GraphMain` also puts the
  open project's name into `ui.projectLabel` for the header.
- **Styles.** Tokens, the Vuetify theme and the reset load globally, so old screens pick up the
  new fonts and colours. The old `* { position: relative; margin: 0; font-weight: normal }` reset
  now applies only inside `.legacy-screen` (the main area of `meta.legacy` routes) and Vuetify
  overlays, with zero specificity. Bootstrap stays loaded until stage 8.
- **API.** `src/api/*.js` wrap `web.js` one function at a time; new code calls `api/`, and
  `web.js` shrinks as old callers move.
- **State.** New features get their own small stores. `stores/session.js` owns the signed-in user;
  the old `store.user` is a getter/setter onto it. Nothing new is added to the old store.

## Style rules for new code

- Colours, spacing, radius and font sizes come from `tokens.css` or the Vuetify theme, never a hex
  value or pixel number in a component.
- Design system fonts, bundled (`styles/fonts.css`) and named in `tokens.css`: IBM Plex Sans for UI
  text (`--md-font-body`), IBM Plex Mono for ids and JSON (`--md-font-mono`), Junicode for titles
  (`--md-font-title`; applied to `h1`–`h3`, Vuetify `text-h1`–`text-h4` and `.md-title`).
- Colours: navy `#002957` header, primary `#1565c0`, teal `#187a62`, graph `#13547a` / `#80d0c7`,
  page `#edf2f6`, text `#17324f`. Spacing on a 4 px scale; radii 4 / 8 / 12 px.
- Styles are scoped; no inline `style=` except computed positions (graph, ROI overlays).
- Dialogs live next to the feature that opens them and are opened with a prop or composable, not a
  global `store.*_open` flag.
- A component over about 300 lines is split before review.

`npm run lint` runs ESLint and `scripts/check-new-code.mjs`, which fails on hex colours, inline
`style=` attributes and Bootstrap classes under `src/app`, `src/ui`, `src/features`, `src/api`,
`src/stores` and `src/styles`.

## Shared UI kit (`src/ui/`)

Use these instead of hand-built equivalents. Each has a unit test in `test/ui/`.

| Component | Use it for | Main props / slots |
| --- | --- | --- |
| `PageHeader` | Title row of a screen (Junicode title) | `title`, `subtitle`; slots `actions`, `subtitle` |
| `ConfirmDialog` | Confirming destructive or important actions | `v-model`, `title`, `message`, `confirmText`, `cancelText`, `danger`, `loading`, `error`; emits `confirm`, `cancel`. The parent does the work and closes it. |
| `EmptyState` | A list or view with nothing in it | `title`, `text`, `icon`; slot `actions` |
| `LoadingState` | A view or panel that is loading | `text`, `inline` |
| `ErrorAlert` | A failed load or action | `error` (string, Error or API `{ status, message }`), `title`, `retryable`; emits `retry` |
| `FormField` | Label, hint and error around any control | `label`, `hint`, `error`, `required`, `id`; default slot gets `{ id, describedby, invalid }` |
| `SectionCard` | A titled panel on a screen | `title`, `overline`; slots `actions`, default |
| `StatusChip` | Job, service or process status | `status` (running, queued, paused, done, failed, …), `label` |

`components/NodeDeleter.vue` already uses `ConfirmDialog` in place of its Bootstrap modal.

## Checks

| Command | What it does |
| --- | --- |
| `npm run build` | Production build |
| `npm test` | Vitest unit tests |
| `npm run lint` | ESLint + new-code style gate |
| `E2E_WRITE=1 npm run test:e2e` | Also runs tests that change data: creates, renames and deletes a throwaway desk |
| `npm run test:e2e` | Playwright: opens every route against the local backend (dev mode on `localhost:8200`, via a Vite server on port 3100) and saves screenshots at 1440 and 1024 px to `e2e/screenshots/$SHOT_LABEL/`. Read-only; the node-delete test opens the dialog and cancels. |

Take `SHOT_LABEL=before` screenshots before a change and `SHOT_LABEL=after` screenshots after it,
then compare them side by side.

## Stage status

| Stage | Status |
| --- | --- |
| 0 Groundwork | Done: dead files removed, ESLint + Prettier, tokens/theme/reset, AppShell with one header, `api/` wrappers, page titles, Playwright smoke tests |
| 1 Shared UI kit | Done: the seven components above with unit tests; node delete moved from a Bootstrap modal to `ConfirmDialog` |
| 2 Simple screens | Done: Help, Introduction, About and Login rewritten in `features/help/`; old `HelpMain`, `Introduction`, `About`, `Login` deleted |
| 3 Home | Done: `features/home/` replaces `Main.vue` (list, sort, create, rename, re-index, new Delete desk with type-the-name confirmation, storage, running jobs, active crunchers, news). Delete desk needs the backend fix in `graph.deleteProject` (it calls `deleteNode` without the user rid and returns 500). |
| 4 Services and admin | Done: `features/services/` (monitor, service control, prompts, cruncher picker with DSpace form and tag filter) and `features/admin/`; old `ServicesMain`, `ServicesAdmin`, `PromptsMain`, `AdminMain`, `CruncherList`, `CrunchersMain`, `DspaceQueryForm`, `TagPickerField`, `ProcessCreator` deleted; `/crunchers` redirects to services |
| 5 Search and entities | Not started |
| 6 File viewer | Not started |
| 7 Project graph | Not started |
| 8 Cleanup | Not started |
