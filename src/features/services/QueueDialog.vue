<script setup>
import EmptyState from '@/ui/EmptyState.vue'

// Active queue jobs of one service, with cancel per job and flush for the
// whole queue.
const open = defineModel({ type: Boolean, default: false })

defineProps({
  service: { type: Object, default: null },
  jobs: { type: Array, default: () => [] },
})

const emit = defineEmits(['cancel-job', 'flush'])
</script>

<template>
  <v-dialog v-model="open" max-width="720">
    <v-card v-if="service" rounded="lg">
      <v-card-item>
        <v-card-title>{{ service.name || service.id }}</v-card-title>
        <v-card-subtitle>Active queue jobs</v-card-subtitle>
        <template #append>
          <v-btn
            color="error"
            size="small"
            variant="tonal"
            prepend-icon="mdi-broom"
            :disabled="!jobs.length"
            @click="emit('flush', service)"
          >
            Flush queued
          </v-btn>
        </template>
      </v-card-item>
      <v-card-text>
        <v-table v-if="jobs.length" density="compact">
          <thead>
            <tr>
              <th>Job / batch</th>
              <th class="text-center">Queued</th>
              <th class="text-center">Running</th>
              <th class="text-center">Total</th>
              <th><span class="queue__sr">Cancel</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="job in jobs" :key="job.rid">
              <td class="queue__rid">{{ job.rid }}</td>
              <td class="text-center">{{ job.queued_files || 0 }}</td>
              <td class="text-center">{{ job.running_files || 0 }}</td>
              <td class="text-center">{{ job.total_files || 0 }}</td>
              <td class="text-end">
                <v-btn
                  size="x-small"
                  color="error"
                  variant="text"
                  icon="mdi-close"
                  :aria-label="`Cancel job ${job.rid}`"
                  @click="emit('cancel-job', job)"
                />
              </td>
            </tr>
          </tbody>
        </v-table>
        <EmptyState v-else title="No active jobs" icon="mdi-tray" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="open = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.queue__rid {
  font-family: var(--md-font-mono);
  font-size: var(--md-font-size-xs);
}

.queue__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
