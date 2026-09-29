<script setup>
import { session } from '@/stores/session.js'
import { ui } from '@/stores/ui.js'
import { useWorkspace } from './useWorkspace.js'

// The desk's side menu, opened from the header's menu button.
const workspace = useWorkspace()

function run(action) {
  ui.drawerOpen = false
  action()
}
</script>

<template>
  <v-navigation-drawer
    v-model="ui.drawerOpen"
    temporary
    width="320"
    :location="$vuetify.display.mobile ? 'bottom' : undefined"
  >
    <v-list nav>
      <v-list-item :to="{ name: 'Home' }" prepend-icon="mdi-arrow-left" title="Back to desks" />
      <v-divider class="my-2" />
      <v-list-item
        prepend-icon="mdi-file-plus-outline"
        title="Add file"
        @click="run(workspace.uploadToDesk)"
      />
      <v-list-group value="sources">
        <template #activator="{ props }">
          <v-list-item v-bind="props" prepend-icon="mdi-database-plus-outline" title="Add source" />
        </template>
        <v-list-item
          prepend-icon="mdi-cloud-arrow-down-outline"
          title="Nextcloud"
          @click="run(() => workspace.openCreateSource('nextcloud'))"
        />
        <v-list-item
          prepend-icon="mdi-cloud-arrow-down-outline"
          title="DSpace 7"
          @click="run(() => workspace.openCreateSource('dspace7'))"
        />
      </v-list-group>
      <v-list-item
        v-if="session.isAdmin"
        prepend-icon="mdi-folder-plus-outline"
        title="Create set"
        @click="run(workspace.openCreateSet)"
      />
    </v-list>
  </v-navigation-drawer>
</template>
