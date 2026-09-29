<script setup>
    // Side drawer of the project workspace (moved out of the old JYUHeader).
    // Opened from the app header's menu button through the ui store.
    import { store } from "./Store.js";
    import { ui } from "../stores/ui.js";
    import RootNodes from './RootNodes.vue'

    const emit = defineEmits(['fit-to-node'])

    function createSource(type) {
      store.source_creator_type = type
      store.source_creator_open = true
      ui.drawerOpen = false
    }

    function fitToNode(id) {
      emit('fit-to-node', id)
    }
</script>

<template>
    <v-navigation-drawer
        v-model="ui.drawerOpen"
        width="375"
        :location="$vuetify.display.mobile ? 'bottom' : undefined"
        temporary
      >
      <v-list lines="two">
        <v-list-item :to="{ name: 'Home' }" prepend-icon="mdi-arrow-left" title="Back to desks" />

        <v-list-item @click="store.uploader_open = true" prepend-icon="mdi-file-plus" title="Add file" />

        <v-list-group value="Actions">
          <template v-slot:activator="{ props }">
            <v-list-item v-bind="props" prepend-icon="mdi-folder-plus" title="Add source" />
          </template>
          <v-list-item @click="createSource('nextcloud')" prepend-icon="mdi-cloud-arrow-down" title="Nextcloud" />
          <v-list-item @click="createSource('dspace7')" prepend-icon="mdi-cloud-arrow-down" title="Dspace7" />
        </v-list-group>

        <v-list-item
          v-if="store.user && store.user.access == 'admin'"
          @click="store.set_creator_open = true"
          prepend-icon="mdi-folder-plus"
          title="Create set"
        />

        <v-divider inset></v-divider>
      </v-list>

      <RootNodes @fit-to-node="fitToNode" />
    </v-navigation-drawer>
</template>
