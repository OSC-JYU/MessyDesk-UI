<script setup>
import TagPickerField from './TagPickerField.vue'
import DspaceQueryForm from './DspaceQueryForm.vue'

// One task parameter, drawn by its `display` (checkbox, dropdown, tagpicker)
// or `component` (dspace) from the service descriptor; text otherwise.
const model = defineModel({ type: null, default: undefined })

defineProps({
  name: { type: String, required: true },
  help: { type: Object, required: true },
  sourceRid: { type: String, default: '' },
})

const emit = defineEmits(['dspace-query'])
</script>

<template>
  <fieldset class="param">
    <legend class="param__name">{{ help.name || name }}</legend>
    <p v-if="help.help" class="param__help">{{ help.help }}</p>

    <DspaceQueryForm
      v-if="help.component === 'dspace'"
      :source-rid="sourceRid"
      @query="emit('dspace-query', $event)"
    />
    <template v-else-if="help.display === 'checkbox' && Array.isArray(help.values)">
      <v-checkbox
        v-for="option in help.values"
        :key="option.value"
        v-model="model"
        :label="option.title"
        :value="option.value"
        density="compact"
        hide-details
      />
    </template>
    <v-checkbox
      v-else-if="help.display === 'checkbox'"
      v-model="model"
      :label="help.name || name"
      density="compact"
      hide-details
    />
    <v-select
      v-else-if="help.display === 'dropdown'"
      v-model="model"
      :items="help.values"
      :label="help.name || name"
      variant="outlined"
      density="compact"
      hide-details
    />
    <TagPickerField v-else-if="help.display === 'tagpicker'" v-model="model" />
    <v-text-field
      v-else
      v-model="model"
      :label="help.name || name"
      variant="outlined"
      density="compact"
      hide-details
    />
  </fieldset>
</template>

<style scoped>
.param {
  margin: 0 0 var(--md-space-4);
  padding: 0;
  border: 0;
}

.param__name {
  font-weight: var(--md-font-weight-medium);
}

.param__help {
  margin: 0 0 var(--md-space-2);
  font-size: var(--md-font-size-xs);
  color: var(--md-color-text-muted);
}
</style>
