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
- One body font (Inter) and one monospace font (JetBrains Mono), both bundled via Fontsource and set
  in `tokens.css`.
- Styles are scoped; no inline `style=` except computed positions (graph, ROI overlays).
- Dialogs live next to the feature that opens them and are opened with a prop or composable, not a
  global `store.*_open` flag.
- A component over about 300 lines is split before review.

`npm run lint` runs ESLint and `scripts/check-new-code.mjs`, which fails on hex colours, inline
`style=` attributes and Bootstrap classes under `src/app`, `src/ui`, `src/features`, `src/api`,
`src/stores` and `src/styles`.

## Checks

| Command | What it does |
| --- | --- |
| `npm run build` | Production build |
| `npm test` | Vitest unit tests |
| `npm run lint` | ESLint + new-code style gate |
| `npm run test:e2e` | Playwright: opens every route against the local backend (dev mode on `localhost:8200`, via a Vite server on port 3100) and saves screenshots at 1440 and 1024 px to `e2e/screenshots/$SHOT_LABEL/`. Read-only. |

Take `SHOT_LABEL=before` screenshots before a change and `SHOT_LABEL=after` screenshots after it,
then compare them side by side.

## Stage status

| Stage | Status |
| --- | --- |
| 0 Groundwork | Done: dead files removed, ESLint + Prettier, tokens/theme/reset, AppShell with one header, `api/` wrappers, page titles, Playwright smoke tests |
| 1 Shared UI kit | Not started |
| 2 Simple screens | Not started |
| 3 Home | Not started |
| 4 Services and admin | Not started |
| 5 Search and entities | Not started |
| 6 File viewer | Not started |
| 7 Project graph | Not started |
| 8 Cleanup | Not started |
