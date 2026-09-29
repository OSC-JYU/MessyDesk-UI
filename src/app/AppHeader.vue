<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { session } from '@/stores/session.js'
import { ui } from '@/stores/ui.js'
import logo from '@/assets/images/md-logo.svg'

const route = useRoute()

const inProject = computed(() => route.matched.some((r) => r.meta.inProject))
const hasDrawer = computed(() => route.matched.some((r) => r.meta.drawer))

const tabs = computed(() => {
  if (inProject.value) {
    const params = { rid: route.params.rid }
    return [
      { label: 'Desk', to: { name: 'project-graph', params } },
      { label: 'Search', to: { name: 'project-search', params } },
      { label: 'Tags', to: { name: 'project-entities', params } },
    ]
  }
  return [
    { label: 'Desks', to: { name: 'Home' } },
    { label: 'Search', to: { name: 'search' } },
    { label: 'Tags', to: { name: 'entities' } },
  ]
})

const activeTab = computed(() => {
  const index = tabs.value.findIndex((tab) => tab.to.name === route.name)
  return index === -1 ? null : index
})

const menu = computed(() =>
  [
    { title: 'Services', icon: 'mdi-format-list-bulleted', to: { name: 'services' }, admin: true },
    { title: 'Admin', icon: 'mdi-account-cog', to: { name: 'admin' }, admin: true },
    { title: 'Prompts', icon: 'mdi-text-box-outline', to: { name: 'prompts' } },
    { title: 'Help', icon: 'mdi-help-circle-outline', to: { name: 'help' } },
  ].filter((item) => !item.admin || session.isAdmin),
)

onMounted(() => session.loadUser())
</script>

<template>
  <v-app-bar class="app-header" flat :height="64">
    <template v-if="hasDrawer" #prepend>
      <v-app-bar-nav-icon
        aria-label="Open desk menu"
        @click.stop="ui.drawerOpen = !ui.drawerOpen"
      />
    </template>

    <router-link :to="{ name: 'Home' }" class="brand">
      <img :src="logo" alt="" class="brand-logo" />
      <span class="brand-name">MessyDesk</span>
    </router-link>

    <template v-if="inProject && ui.projectLabel">
      <v-divider vertical class="brand-divider" />
      <span class="project-label" :title="ui.projectLabel">{{ ui.projectLabel }}</span>
    </template>

    <v-spacer />

    <v-tabs :model-value="activeTab" class="nav-tabs" height="64" slider-color="accent">
      <v-tab v-for="tab in tabs" :key="tab.label" :to="tab.to" :exact="true">
        {{ tab.label }}
      </v-tab>
    </v-tabs>

    <v-menu location="bottom end">
      <template #activator="{ props }">
        <v-btn icon v-bind="props" aria-label="Account and settings" class="ms-2 me-2">
          <v-icon>mdi-account-circle-outline</v-icon>
        </v-btn>
      </template>
      <v-list density="compact" min-width="220">
        <v-list-item v-if="session.user" :subtitle="session.user.access" :title="session.user.id" />
        <v-divider v-if="session.user" />
        <v-list-item
          v-for="item in menu"
          :key="item.title"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
        />
        <v-divider />
        <v-list-item href="/Shibboleth.sso/Logout" prepend-icon="mdi-logout" title="Log out" />
      </v-list>
    </v-menu>
  </v-app-bar>
</template>

<style scoped>
.app-header {
  background: var(--md-gradient-brand), var(--md-color-brand-700) !important;
  color: var(--md-color-text-on-brand) !important;
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--md-space-3);
  margin-inline: var(--md-space-4) var(--md-space-2);
  color: inherit;
  text-decoration: none;
}

.brand-logo {
  height: 40px;
  width: auto;
}

.brand-name {
  font-size: var(--md-font-size-lg);
  font-weight: var(--md-font-weight-bold);
  letter-spacing: 0.01em;
}

.brand-divider {
  margin-inline: var(--md-space-3);
  opacity: 0.4;
}

.project-label {
  max-width: 32ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--md-font-size-md);
  font-weight: var(--md-font-weight-medium);
}

.nav-tabs :deep(.v-tab) {
  letter-spacing: 0.04em;
  font-weight: var(--md-font-weight-medium);
}
</style>
