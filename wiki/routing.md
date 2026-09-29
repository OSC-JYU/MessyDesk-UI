# Routing

## Router Setup

The router uses `createWebHistory` with `VITE_PUBLIC_PATH` as the base. Routes are defined in `src/app/router.js`. Every route component is lazy-loaded (`() => import(...)`), so each screen is its own chunk. Route `meta` carries `title` (page title, set in `router.afterEach`), `legacy` (still served by an old view in `src/components/`), `drawer` / `inProject` (project workspace header behaviour) and `shell: false` (no app header, used by the login page).

**Verified from:** `src/app/router.js`

## Route Table

| Path | Name | Component | Notes |
|------|------|-----------|-------|
| `/` | Home | `features/home/HomePage` | Desk list and home dashboard |
| `/graph` | — | redirect | Legacy: redirects `?node=xxx` → `/project/xxx` |
| `/project/:rid` | — | `GraphMain` | Shell for project views (nested routes) |
| `/project/:rid` (child `''`) | project-graph | `GraphDisplay` | Graph canvas |
| `/project/:rid/search` | project-search | `features/search/SearchPage` | Project-scoped search |
| `/project/:rid/entities` | project-entities | `features/tags/TagsPage` | Project-scoped tags |
| `/project/:rid/file/:fileRid` | project-file | `features/files/FileViewer` | File viewer |
| `/services` | services | `features/services/ServicesPage` | Service monitor |
| `/services/admin` | services-admin | `features/services/ServiceControlPage` | Install/start/stop/forget services; `meta.requiresAdmin` |
| `/intro` | introduction | `features/help/IntroPage` | Introduction tour |
| `/files/:rid` | files | `features/files/FileViewer` | File viewer outside a desk |
| `/crunchers` | — | redirect → services | Old stand-alone cruncher page |
| `/search` | search | `features/search/SearchPage` | Search across desks |
| `/prompts` | prompts | `features/services/PromptsPage` | Saved prompts |
| `/help/:slug?` | help | `features/help/HelpPage` | General help |
| `/help/services/:service/` | service-help | `features/help/HelpPage` | Per-service help |
| `/help/services/:service/:assetPath(.*)*` | service-help-asset | `features/help/HelpPage` | Help asset resolution |
| `/tags` | tags | redirect → entities | Legacy alias |
| `/entities` | entities | `features/tags/TagsPage` | Tag browser across desks |
| `/admin` | admin | `features/admin/AdminPage` | Admin panel (Requests/Users/Services/Service groups tabs, tab kept in `?tab=`); gated by `meta.requiresAdmin` |
| `/about` | about | `features/help/AboutPage` | About page |
| `/login` | login | `features/help/LoginPage` | SSO permission request page (no app header) |

**Verified from:** `src/app/router.js` (route definitions)

### Admin Route Guard

`/admin` has `meta: { requiresAdmin: true }`; a router `beforeEach` guard checks
`session.isAdmin` (`stores/session.js`) for any matched route with that meta and redirects away otherwise.
This is enforced independently of nav-link visibility (which merely hides the link for non-admins) and
independently of each backend admin route's own `access === 'admin'` check.

**Verified from:** `src/app/router.js`

## Key Routing Patterns

### Project Context (Nested Routes)

`/project/:rid` is a nested route shell (`GraphMain`). The shell provides:
- The app bar/header with tabs (Desk, Search, Tags)
- Shared sidepanel (NodeCard) when in graph view
- Dialogs (Uploader, NodeDeleter, SetCreator, SourceCreator)

Child routes render in a `<router-view>` that uses `keep-alive` to cache `GraphDisplay`.

**Verified from:** `src/components/GraphMain.vue` template

### File Navigation via Browse Context

When opening a file from a set, the route includes query parameters (`browseMode`, `setRid`, `setLabel`, `fileCount`, `skip`, `sourceRid`, `sourceLabel`) that encode the browsing context. `FileViewer` (`useFileViewer.js`) reads them back; see [file-display-system.md](file-display-system.md). This keeps previous/next working within a set after a reload.

**Verified from:** `src/features/files/browseQuery.js`, `useFileViewer.js`

### Legacy Graph Route Redirect

The old URL pattern `/graph?node=xxx` is redirected to `/project/xxx` for backward compatibility.

**Verified from:** `src/app/router.js`

## Navigation Flow

```mermaid
graph TD
    Home["/ (Main)"] --> ProjectShell["/project/:rid (GraphMain)"]
    ProjectShell --> GraphView["GraphDisplay"]
    ProjectShell --> SearchView["SearchPage (project)"]
    ProjectShell --> EntitiesView["TagsPage (project)"]
    ProjectShell --> FileView["FileViewer"]
    GraphView -->|double-click node| FileView
    GraphView -->|double-click set| SetPanel["SetPanel (inline)"]
    SetPanel -->|double-click file| FileView
```
