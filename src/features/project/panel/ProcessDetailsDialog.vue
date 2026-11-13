<script setup>
import { computed, reactive, watch } from 'vue'
import { getBatch, resumeBatch } from '@/api/services.js'
import StatusChip from '@/ui/StatusChip.vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import ApiKeyDialog from '@/features/services/crunchers/ApiKeyDialog.vue'
import { loadCredentialFields } from '@/features/services/crunchers/serviceCredentials.js'

// The raw details of a processing step and its batch job; a paused batch
// can be resumed from here.
const open = defineModel({ type: Boolean, default: false })
const props = defineProps({ node: { type: Object, required: true } })

const state = reactive({ batch: null, loading: false, resuming: false, error: null })
const keyDialog = reactive({ open: false, error: '', fields: [] })
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

async function resume(apiKey) {
  state.resuming = true
  try {
    await resumeBatch(props.node.id, { apiKey })
    keyDialog.open = false
    keyDialog.fields = []
    await refresh()
  } catch (error) {
    // A provider that needs the user's own key asks for it again.
    if (/own API key/i.test(error?.message || '')) {
      if (!keyDialog.open) {
        keyDialog.fields = await loadCredentialFields(
          state.batch?.topic || state.batch?.service_id || props.node.data?.service_id,
        )
      }
      keyDialog.error = apiKey ? error.message : ''
      keyDialog.open = true
    } else {
      state.error = error
    }
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
            @click="resume()"
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
    <ApiKeyDialog
      v-model="keyDialog.open"
      :error="keyDialog.error"
      :fields="keyDialog.fields"
      @submit="resume($event)"
    />
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
