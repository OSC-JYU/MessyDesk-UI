<script setup>
import { reactive } from 'vue'
import SectionCard from '@/ui/SectionCard.vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'

// Form for a new desk. `create` gets the name and resolves to the new desk.
const props = defineProps({
  create: { type: Function, required: true },
})

const state = reactive({ name: '', pending: false, error: null })

async function submit() {
  const name = state.name.trim()
  if (!name) {
    state.error = 'Please give your desk a name.'
    return
  }
  state.pending = true
  state.error = null
  try {
    await props.create(name)
    state.name = ''
  } catch (error) {
    state.error = error
  } finally {
    state.pending = false
  }
}
</script>

<template>
  <SectionCard overline="Start something new" title="Create a desk">
    <p class="create-desk__hint">
      Give your desk a clear name, for example <em>Letters 1917</em> or
      <em>Museum Photos Spring</em>.
    </p>
    <form class="create-desk__form" @submit.prevent="submit">
      <v-text-field
        v-model="state.name"
        label="Desk name"
        variant="outlined"
        density="comfortable"
        hide-details="auto"
        class="create-desk__field"
      />
      <v-btn type="submit" color="secondary" size="large" variant="flat" :loading="state.pending">
        Create desk
      </v-btn>
    </form>
    <ErrorAlert :error="state.error" title="Could not create the desk" class="mt-4" />
  </SectionCard>
</template>

<style scoped>
.create-desk__hint {
  margin: 0 0 var(--md-space-4);
  color: var(--md-color-text-muted);
}

.create-desk__hint em {
  font-style: italic;
  font-weight: var(--md-font-weight-regular);
  background: none;
}

.create-desk__form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--md-space-3);
}

.create-desk__field {
  flex: 1 1 var(--md-card-min-width);
}
</style>
