<script setup>
import { computed, reactive, watch } from 'vue'
import { getBatch, resumeBatch } from '@/api/services.js'
import StatusChip from '@/ui/StatusChip.vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'

// The raw details of a processing step and its batch job; a paused batch
// can be resumed from here.
const open = defineModel({ type: Boolean, default: false })
const props = defineProps({ node: { type: Object, required: true } })

const state = reactive({ batch: null, loading: false, resuming: false, error: null })
const status = computed(
  () => state.batch?.status || state.batch?.state || props.node.data?.status || 'unknown',
)
const details = computed(() =>
  JSON.stringify(
    { rid: props.node.id, type: props.node.type, node: props.node.data, batch: state.batch },
    null,
    2,
  ),
)

async function refresh() {
  state.loading = true
  state.error = null
  try {
    state.batch = await getBatch(props.node.id)
  } catch (error) {
    state.batch = null
    state.error = error
  } finally {
    state.loading = false
  }
}

async function resume() {
  state.resuming = true
  try {
    await resumeBatch(props.node.id)
    await refresh()
  } catch (error) {
    state.error = error
  } finally {
    state.resuming = false
  }
}

watch(open, (isOpen) => isOpen && refresh())
</script>

<template>
  <v-dialog v-model="open" max-width="920" scrollable>
    <v-card rounded="lg">
      <v-card-item>
        <v-card-title>Process details</v-card-title>
        <template #append><StatusChip :status="status" /></template>
      </v-card-item>
      <v-card-text>
        <ErrorAlert :error="state.error" title="Could not load the batch" class="mb-3" />
        <div class="process-details__actions">
          <v-btn
            size="small"
            variant="outlined"
            prepend-icon="mdi-refresh"
            :loading="state.loading"
            @click="refresh"
            >Refresh</v-btn
          >
          <v-btn
            v-if="status === 'paused'"
            size="small"
            color="primary"
            variant="flat"
            prepend-icon="mdi-play"
            :loading="state.resuming"
            @click="resume"
          >
            Resume
          </v-btn>
        </div>
        <pre class="process-details__json">{{ details }}</pre>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="open = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.process-details__actions {
  display: flex;
  gap: var(--md-space-2);
  margin-block-end: var(--md-space-3);
}

.process-details__json {
  max-height: 55dvh;
  overflow: auto;
  padding: var(--md-space-3);
  border-radius: var(--md-radius-md);
  background: var(--md-color-header);
  color: var(--md-color-text-on-dark);
  font-size: var(--md-font-size-xs);
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
