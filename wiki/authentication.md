# Authentication & Session

## Auth Flow

The application uses SSO (Single Sign-On) with session-based authentication. The backend handles the auth protocol; the frontend only checks session validity.

**Verified from:** `src/app/App.vue`, `src/web.js`

## Session Check Mechanism

`src/app/App.vue` on mount:
1. Calls `web.ready()` → `GET /api`
2. If successful and currently on `/login` page, redirects to home
3. If 401 and not on `/login`, redirects to `/login`
4. If 302 (expired session), sets `store.logged_out = true` (shows "session expired" banner)

This check repeats every 30 seconds via `setInterval`.

**Verified from:** `src/app/App.vue` (`login` function, `onMounted`)

## Session Expiry UI

When `store.logged_out` is `true`, the entire `<router-view>` is replaced with a centered alert: "Your session expired" + reload button.

**Verified from:** `src/app/App.vue` (template)

## Login Page

The `/login` route shows `features/help/LoginPage.vue`, without the app header. It:
1. Calls `getSsoUser()` (`api/session.js`) → `GET /api/sso` to get SSO user info (the old page called `.json()` on the axios response, so the identity never showed)
2. Displays user email/name
3. Shows "not registered" message (i18n)
4. Provides a button to send a permission request (`addPermissionRequest()` → `POST /api/permissions/request`)

A registered user who opens `/login` is sent to the home page by the session check in `App.vue`.

This is not a login form—it's a registration/permission-request page for authenticated but unauthorized users.

**Verified from:** `src/features/help/LoginPage.vue`

## Permissions

- `web.addPermissionRequest()` — User requests access
- `web.getPermissionRequests()` — Admin lists pending requests
- `web.removePermissionRequest(rid)` — Admin approves/removes request

**Verified from:** `src/web.js`

## Non-Obvious Behavior

- **No token management in frontend:** Authentication is entirely cookie/session-based. The frontend never handles tokens, JWTs, or auth headers.
- **Periodic polling, not event-driven:** Session validity is checked by polling every 30 seconds, not by intercepting 401s from API calls (though the global error interceptor does catch them).
- **Redirect logic assumes path-based routing:** The login redirect uses `window.location.pathname.includes('login')` which could break if the public path prefix contains "login".

**Verified from:** `src/app/App.vue`
