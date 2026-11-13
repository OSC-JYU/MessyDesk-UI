<script setup>
// The menu of actions of one desk, shared by the list and the grid.
defineProps({
  row: { type: Object, required: true },
})
const emit = defineEmits(['rename', 'reindex', 'delete'])
</script>

<template>
  <v-menu location="bottom end">
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        icon="mdi-dots-vertical"
        size="small"
        variant="text"
        :aria-label="`Actions for ${row.name}`"
      />
    </template>
    <v-list density="compact">
      <v-list-item prepend-icon="mdi-pencil" title="Rename desk" @click="emit('rename', row)" />
      <v-list-item
        prepend-icon="mdi-refresh"
        title="Re-index search"
        @click="emit('reindex', row)"
      />
      <v-divider />
      <v-list-item
        prepend-icon="mdi-delete-outline"
        title="Delete desk"
        base-color="error"
        @click="emit('delete', row)"
      />
    </v-list>
  </v-menu>
</template>
