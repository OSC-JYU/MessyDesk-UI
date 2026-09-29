<script setup>
// Confirmation dialog for destructive or important actions. The parent owns
// the open state (v-model) and the work: it listens for `confirm`, sets
// `loading` while working, and closes the dialog or passes an `error`.
const open = defineModel({ type: Boolean, default: false })

const props = defineProps({
  title: { type: String, required: true },
  message: { type: String, default: '' },
  confirmText: { type: String, default: 'Confirm' },
  cancelText: { type: String, default: 'Cancel' },
  danger: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  // Keeps the confirm button disabled, e.g. until a name is typed.
  confirmDisabled: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['confirm', 'cancel'])

function cancel() {
  if (props.loading) return
  open.value = false
  emit('cancel')
}
</script>

<template>
  <v-dialog v-model="open" max-width="480" :persistent="loading" @click:outside="cancel">
    <v-card class="confirm-dialog" rounded="lg" role="alertdialog" :aria-label="title">
      <v-card-title class="confirm-dialog__title">
        <v-icon
          v-if="danger"
          icon="mdi-alert-outline"
          color="error"
          size="small"
          class="me-2"
          aria-hidden="true"
        />
        {{ title }}
      </v-card-title>
      <v-card-text>
        <p v-if="message" class="confirm-dialog__message">{{ message }}</p>
        <slot />
        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-3">
          {{ error }}
        </v-alert>
      </v-card-text>
      <v-card-actions class="confirm-dialog__actions">
        <v-spacer />
        <v-btn variant="text" :disabled="loading" data-test="cancel" @click="cancel">
          {{ cancelText }}
        </v-btn>
        <v-btn
          :color="danger ? 'error' : 'primary'"
          variant="flat"
          :loading="loading"
          :disabled="confirmDisabled"
          data-test="confirm"
          @click="emit('confirm')"
        >
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.confirm-dialog__title {
  display: flex;
  align-items: center;
  padding: var(--md-space-4) var(--md-space-5) var(--md-space-2);
  font-weight: var(--md-font-weight-bold);
}

.confirm-dialog__message {
  margin: 0;
  color: var(--md-color-text);
}

.confirm-dialog__actions {
  padding: var(--md-space-2) var(--md-space-4) var(--md-space-4);
}
</style>
