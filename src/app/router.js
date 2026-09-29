/* eslint-disable no-restricted-syntax -- the router is the switch between old and new screens */
import { createRouter, createWebHistory } from 'vue-router'
import { session } from '@/stores/session.js'

// Each route points at its old view until the new version replaces it.
// meta.title sets the page title; meta.shell === false hides the app header;
// meta.drawer shows the header's drawer button for the project workspace;
// meta.legacy marks a route still served by an old view (see styles/legacy.css).
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/features/home/HomePage.vue'),
    meta: { title: 'Desks' },
  },

  // Legacy redirect: /graph?node=xxx → /project/xxx
  {
    path: '/graph',
    redirect: (to) =>
      to.query.node ? { name: 'project-graph', params: { rid: to.query.node } } : { name: 'Home' },
  },

  {
    path: '/project/:rid',
    component: () => import('@/components/GraphMain.vue'),
    meta: { legacy: true, drawer: true, inProject: true },
    children: [
      {
        path: '',
        name: 'project-graph',
        component: () => import('@/components/GraphDisplay.vue'),
        meta: { legacy: true, title: 'Desk' },
      },
      {
        path: 'search',
        name: 'project-search',
        component: () => import('@/features/search/SearchPage.vue'),
        meta: { legacy: true, title: 'Search' },
      },
      {
        path: 'entities',
        name: 'project-entities',
        component: () => import('@/features/tags/TagsPage.vue'),
        meta: { legacy: true, title: 'Tags' },
      },
      {
        path: 'file/:fileRid',
        name: 'project-file',
        component: () => import('@/features/files/FileViewer.vue'),
        meta: { legacy: true, title: 'File' },
      },
    ],
  },

  {
    path: '/services',
    name: 'services',
    component: () => import('@/features/services/ServicesPage.vue'),
    meta: { title: 'Services' },
  },
  {
    path: '/services/admin',
    name: 'services-admin',
    component: () => import('@/features/services/ServiceControlPage.vue'),
    meta: { title: 'Service control', requiresAdmin: true },
  },
  {
    path: '/intro',
    name: 'introduction',
    component: () => import('@/features/help/IntroPage.vue'),
    meta: { title: 'Introduction' },
  },
  {
    path: '/files/:rid',
    name: 'files',
    component: () => import('@/features/files/FileViewer.vue'),
    meta: { title: 'File' },
  },
  // The old stand-alone cruncher page needed a selected node; crunchers now open from the desk.
  { path: '/crunchers', redirect: { name: 'services' } },
  {
    path: '/search',
    name: 'search',
    component: () => import('@/features/search/SearchPage.vue'),
    meta: { title: 'Search' },
  },
  {
    path: '/prompts',
    name: 'prompts',
    component: () => import('@/features/services/PromptsPage.vue'),
    meta: { title: 'Prompts' },
  },
  {
    path: '/help/services/:service/',
    name: 'service-help',
    component: () => import('@/features/help/HelpPage.vue'),
    meta: { title: 'Help' },
  },
  {
    path: '/help/services/:service/:assetPath(.*)*',
    name: 'service-help-asset',
    component: () => import('@/features/help/HelpPage.vue'),
    meta: { title: 'Help' },
  },
  {
    path: '/help/:slug?',
    name: 'help',
    component: () => import('@/features/help/HelpPage.vue'),
    meta: { title: 'Help' },
  },
  { path: '/tags', name: 'tags', redirect: { name: 'entities' } },
  {
    path: '/entities',
    name: 'entities',
    component: () => import('@/features/tags/TagsPage.vue'),
    meta: { title: 'Tags' },
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/features/admin/AdminPage.vue'),
    meta: { title: 'Admin', requiresAdmin: true },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/features/help/AboutPage.vue'),
    meta: { title: 'About' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/features/help/LoginPage.vue'),
    meta: { title: 'Sign in', shell: false },
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_PUBLIC_PATH),
  routes,
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAdmin) return true
  await session.loadUser()
  return session.isAdmin ? true : { name: 'services' }
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · MessyDesk` : 'MessyDesk'
})
