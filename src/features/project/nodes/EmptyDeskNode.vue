<script setup>
// Vue Flow passes more props (id, label, position, …) than a node uses;
// they must not fall through onto the frame.
defineOptions({ inheritAttrs: false })
import { useWorkspace } from '../useWorkspace.js'

// Shown on a desk with nothing on it.
defineProps({ data: { type: Object, required: true } })
const workspace = useWorkspace()
</script>

<template>
  <v-card class="empty-desk" rounded="lg" flat>
    <v-card-title class="empty-desk__title">{{ data.label }}</v-card-title>
    <v-card-text>
      <p class="empty-desk__quote">
        “If a cluttered desk is a sign of a cluttered mind, of what, then, is an empty desk a sign?”
      </p>
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-upload"
        class="nodrag"
        @click="workspace.uploadToDesk()"
      >
        Upload a file
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.empty-desk {
  width: var(--md-node-width-wide);
  border: 1px solid var(--md-color-border);
  box-shadow: var(--md-shadow-2);
}

.empty-desk__title {
  font-family: var(--md-font-title);
  font-size: var(--md-font-size-xl);
}

.empty-desk__quote {
  margin: 0 0 var(--md-space-4);
  color: var(--md-color-text-muted);
  font-style: italic;
}
</style>
