# UI rewrite

The UI is being rewritten route by route in this repository. The full plan (stages, checks, open
questions) is the "MessyDesk UI rewrite plan" document; this page records what the code does.

## Target structure

```
src/
  app/        main.js, router.js, App.vue, AppShell.vue, AppHeader.vue
  styles/     tokens.css, reset.css, fonts.css, vuetify-theme.js
  api/        one module per backend area
  stores/     one small store per area
  ui/         shared building blocks (stage 1)
  features/   home, project, files, search, services, admin, help, settings
```

## How old and new code lived together

Every route was switched from its old view to the new one in turn, and the old files were deleted in the
same change. Since stage 7 there is no old UI code left: `src/components/` and the old global store are
gone. Stage 8 removed Bootstrap and the unused dependencies and moved the old API client to
`src/api/client.js`.

- **One header.** `AppShell` renders `AppHeader` and the main area for every route except
  `meta.shell: false` (login).
- **API.** `src/api/*.js` wrap `client.js`; code calls the area modules only.
- **State.** Small stores (`src/stores/`) and, per desk, the workspace (`useWorkspace`). Dialogs are
  opened through workspace actions, never global flags.

## Style rules for new code

- Colours, spacing, radius and font sizes come from `tokens.css` or the Vuetify theme, never a hex
  value or pixel number in a component.
- Design system fonts, bundled (`styles/fonts.css`) and named in `tokens.css`: IBM Plex Sans for UI
  text (`--md-font-body`), IBM Plex Mono for ids and JSON (`--md-font-mono`), Junicode for titles
  (`--md-font-title`; applied to `h1`–`h3`, Vuetify `text-h1`–`text-h4` and `.md-title`).
- Colours: the Fjord theme (`tokens.css`, Vuetify themes `fjord` (default) and `fjordDark`, CSS switched by
  `<html data-theme>`). Teal (`primary`) is the action colour, navy (`secondary`) marks sets, the process
  colours are for the graph. Spacing on a 4 px scale; radii 4 / 8 / 12 px.
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
| `ThumbnailImage` | Any thumbnail from `/api/thumbnails` | `src`, `alt`, `lazy`, `compact` (no text); shows the "not ready" placeholder on 404 |
| `CrunchIcon` | The cruncher cookie button icon | `size`, `plus`; colours follow the cookie preset |


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
| 5 Search and entities | Done: `features/search/` (SearchPage, shared ResultsGrid/ResultCard, ProjectScope, file opener) and `features/tags/` (TagsPage, NER label mentions with preview, add-tag dialog); `stores/fileBrowse.js` and `stores/pageMemory.js` replace old store fields; `SearchMain` and `EntitiesMain` deleted |
| 6 File viewer | Done: `features/files/` (viewer shell, 9 displays, tools, ROI editor) replaces `FileDisplayWrapper`, `FilesMain` and 22 display/tool components; the big editors were ported without redesign and checked only with unit tests, since the local backend has no image/OCR data |
| 7 Project graph | Done: `features/project/` (workspace, canvas, 8 node components on a shared shell, set browser, node panel, dialogs) and `features/jobs/JobsPanel.vue` replace GraphMain, GraphDisplay, NodeCard, the 23 node files, creators, uploader, drawer, set panel and the debug panel; the old store and legacy.css are deleted |
| 8 Cleanup | Done: Bootstrap, bootstrap-icons, Popper, vue-pdf-embed, vue-sidebar-menu-akahon, vue3-image-multiselect-areas and vue-cli-plugin-vuetify removed; `reset.css` covers what Bootstrap's reboot did; `web.js` moved to `src/api/client.js` and linted; 30 s session polling replaced by a 401/302 handler in the API client. Bundle vs stage 0: JS 1,412 → 656 kB, CSS 1,125 → 787 kB |

## After the rewrite

- **Settings page** (`features/settings/`, account menu → Settings): theme (Fjord light, Fjord dark, follow the system, or MessyDesk classic, the original navy and blue look: `[data-theme='classic']` in `tokens.css` and `classic` in `vuetify-theme.js`), the cruncher cookie colour (classic, double chocolate, matcha, strawberry, blueberry) and motion (`data-motion='off'` on `<html>` stops animations, see `reset.css`). Presets are `[data-cookie]` blocks in `tokens.css`. Needs the backend `PUT /api/me/settings` (MessyDesk branch `claude/user-settings`).
- **Thumbnail placeholder** (`ui/ThumbnailImage.vue`): the backend answers 404 for a thumbnail that is not made yet, and the UI shows a themed placeholder (a cookie with rising steam, "Preview not ready yet") instead of the old bitmap. It tries again when the thumbnail version changes. Used by the graph nodes, node panel, search results and lineage panel.
