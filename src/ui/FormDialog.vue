<script setup>
import ErrorAlert from '@/ui/ErrorAlert.vue'

// Small dialog around a form with Cancel and a submit button. The parent
// owns the fields and runs the work in `submit`.
const open = defineModel({ type: Boolean, default: false })

defineProps({
  title: { type: String, required: true },
  submitText: { type: String, default: 'Save' },
  pending: { type: Boolean, default: false },
  error: { type: [String, Object], default: null },
})

const emit = defineEmits(['submit'])
</script>

<template>
  <v-dialog v-model="open" max-width="520" :persistent="pending">
    <v-card rounded="lg" :title="title">
      <form @submit.prevent="emit('submit')">
        <v-card-text>
          <slot />
          <ErrorAlert :error="error" :title="`${title} failed`" class="mt-2" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="pending" @click="open = false">Cancel</v-btn>
          <v-btn type="submit" color="primary" variant="flat" :loading="pending">{{
            submitText
          }}</v-btn>
        </v-card-actions>
      </form>
    </v-card>
  </v-dialog>
</template>
