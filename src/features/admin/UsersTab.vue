<script setup>
// Users with their access level and service groups (editable inline).
defineProps({
  users: { type: Array, required: true },
  groupIds: { type: Array, required: true },
})
const emit = defineEmits(['update-groups', 'add'])

const headers = [
  { title: 'Name', key: 'label' },
  { title: 'Email', key: 'id' },
  { title: 'Rights', key: 'access' },
  { title: 'Service groups', key: 'service_groups', sortable: false },
  { title: 'RID', key: '@rid' },
  { title: 'Active', key: 'active' },
]
</script>

<template>
  <div class="users-tab__toolbar">
    <v-btn
      color="primary"
      variant="flat"
      size="small"
      prepend-icon="mdi-account-plus"
      @click="emit('add')"
    >
      Add user
    </v-btn>
  </div>
  <v-data-table :items="users" :headers="headers" density="comfortable" item-value="@rid">
    <template #[`item.access`]="{ item }">
      <v-chip
        size="small"
        variant="tonal"
        :color="item.access === 'admin' ? 'primary' : undefined"
        label
      >
        {{ item.access }}
      </v-chip>
    </template>
    <template #[`item.service_groups`]="{ item }">
      <v-select
        v-model="item.service_groups"
        :items="groupIds"
        :aria-label="`Service groups of ${item.label || item.id}`"
        multiple
        chips
        closable-chips
        density="compact"
        variant="underlined"
        hide-details
        class="users-tab__groups"
        @update:model-value="emit('update-groups', item)"
      />
    </template>
    <template #[`item.@rid`]="{ item }">
      <code>{{ item['@rid'] }}</code>
    </template>
    <template #[`item.active`]="{ item }">
      <v-icon
        :icon="item.active ? 'mdi-check-circle' : 'mdi-minus-circle-outline'"
        :color="item.active ? 'success' : undefined"
        :aria-label="item.active ? 'Active' : 'Inactive'"
      />
    </template>
  </v-data-table>
</template>

<style scoped>
.users-tab__toolbar {
  display: flex;
  justify-content: flex-end;
  margin-block-end: var(--md-space-3);
}

.users-tab__groups {
  min-width: calc(var(--md-card-min-width) * 0.75);
}
</style>
