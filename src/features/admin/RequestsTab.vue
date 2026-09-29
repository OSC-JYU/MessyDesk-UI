<script setup>
import EmptyState from '@/ui/EmptyState.vue'

// Access requests from SSO users without an account.
defineProps({ requests: { type: Array, required: true } })
const emit = defineEmits(['accept', 'remove'])
</script>

<template>
  <EmptyState
    v-if="!requests.length"
    icon="mdi-account-clock-outline"
    title="No access requests"
    text="People who sign in without an account can ask for access; their requests show up here."
  />
  <v-table v-else density="comfortable">
    <thead>
      <tr>
        <th>Email</th>
        <th class="text-end">Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="request in requests" :key="request['@rid']">
        <td>{{ request.label || request.id }}</td>
        <td class="text-end">
          <v-btn
            color="primary"
            size="small"
            variant="flat"
            prepend-icon="mdi-account-plus"
            @click="emit('accept', request)"
          >
            Accept
          </v-btn>
          <v-btn
            color="error"
            size="small"
            variant="text"
            prepend-icon="mdi-delete-outline"
            class="ms-2"
            @click="emit('remove', request)"
          >
            Remove
          </v-btn>
        </td>
      </tr>
    </tbody>
  </v-table>
</template>
