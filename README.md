# MessyDesk-UI

https://github.com/OSC-JYU/MessyDesk

.env file defines the public url.

Vue 3 + Vite + Vuetify frontend for MessyDesk. The UI is being rewritten route by route;
see [wiki/rewrite.md](wiki/rewrite.md) for the structure and rules, and [wiki/](wiki/README.md)
for architecture notes.

## Development

```sh
npm install
npm run dev        # Vite on port 3000, proxies /api, /events, /images, /icons to localhost:8200
npm run build      # production build
npm test           # unit tests (Vitest)
npm run lint       # ESLint + style gate for new code
npm run test:e2e   # Playwright route smoke tests against the local backend
npm run format     # Prettier for new code
```

CAT: https://www.pexels.com/photo/close-up-photo-of-yellow-and-white-cat-57416/
