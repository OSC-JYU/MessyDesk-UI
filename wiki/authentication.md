# Authentication & Session

## Auth Flow

The application uses SSO (Single Sign-On) with session-based authentication. The backend handles the auth protocol; the frontend only checks session validity.

**Verified from:** `src/app/App.vue`, `src/api/client.js`

## Session Check Mechanism

The API client (`src/api/client.js`) reports every 401 or 302 response to a handler that `src/app/App.vue` registers with `onAuthError()`:
- 401 (no MessyDesk account) and not on `/login` → redirect to `/login`
- 302 (the sign-in proxy redirecting, i.e. the session expired) → `session.expired = true` (shows the "session expired" banner)

So an expired session is noticed on the first API call that fails, from any screen. In addition, `App.vue` calls `ready()` (`GET /api`) on mount and whenever the tab becomes visible again (`visibilitychange`), so the banner shows up before the user acts after a long break. When that check succeeds on `/login`, the user is sent to the home page. There is no timer (until stage 8 the check ran every 30 seconds).

**Verified from:** `src/app/App.vue` (`handleAuthError`, `checkSession`), `src/api/client.js` (`onAuthError`), `test/api/client.spec.js`

## Session Expiry UI

When `session.expired` (`src/stores/session.js`) is `true`, the entire `<router-view>` is replaced with a centered alert: "Your session expired" + reload button.

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

- `addPermissionRequest()` (`api/session.js`) — User requests access
- `getPermissionRequests()` (`api/admin.js`) — Admin lists pending requests
- `removePermissionRequest(rid)` (`api/admin.js`) — Admin approves/removes request

**Verified from:** `src/api/client.js`

## Non-Obvious Behavior

- **No token management in frontend:** Authentication is entirely cookie/session-based. The frontend never handles tokens, JWTs, or auth headers.
- **Event-driven, not polled:** Session validity comes from the status of real API calls (401/302 in the interceptor), plus one check when the tab becomes visible.
- **Redirect logic assumes path-based routing:** The login redirect uses `window.location.pathname.includes('login')` which could break if the public path prefix contains "login".

**Verified from:** `src/app/App.vue`
