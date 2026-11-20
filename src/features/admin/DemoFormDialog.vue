<script setup>
import { reactive, watch } from 'vue'
import FormDialog from '@/ui/FormDialog.vue'

// Create a demo from a desk, or edit the texts and sharing of an existing one.
// `demo` is null when creating. `groups` are the service group ids, `desks` the admin's desks.
const open = defineModel({ type: Boolean, default: false })
const props = defineProps({
  demo: { type: Object, default: null },
  groups: { type: Array, default: () => [] },
  desks: { type: Array, default: () => [] },
  pending: { type: Boolean, default: false },
  error: { type: [String, Object], default: null },
})
const emit = defineEmits(['submit'])

const form = reactive({
  project: '',
  titleEn: '',
  titleFi: '',
  descriptionEn: '',
  descriptionFi: '',
  serviceGroups: [],
  users: [],
})

watch(open, (isOpen) => {
  if (!isOpen) return
  const demo = props.demo
  Object.assign(form, {
    project: '',
    titleEn: demo?.title?.en || '',
    titleFi: demo?.title?.fi || '',
    descriptionEn: demo?.description?.en || '',
    descriptionFi: demo?.description?.fi || '',
    serviceGroups: [...(demo?.service_groups || [])],
    users: [...(demo?.users || [])],
  })
})

// Choosing a desk suggests its name and description, unless the admin has typed them already.
watch(
  () => form.project,
  (rid) => {
    const desk = props.desks.find((d) => d['@rid'] === rid)
    if (!desk) return
    if (!form.titleEn.trim()) form.titleEn = desk.label || ''
    if (!form.descriptionEn.trim()) form.descriptionEn = desk.description || ''
  },
)

// Empty texts are left out; the backend keeps only languages that have text.
function texts(en, fi) {
  return { ...(en.trim() ? { en: en.trim() } : {}), ...(fi.trim() ? { fi: fi.trim() } : {}) }
}

function submit() {
  emit('submit', {
    ...(props.demo ? {} : { project: form.project }),
    title: texts(form.titleEn, form.titleFi),
    description: texts(form.descriptionEn, form.descriptionFi),
    service_groups: form.serviceGroups,
    users: form.users,
  })
}
</script>

<template>
  <FormDialog
    v-model="open"
    :title="demo ? 'Edit demo' : 'Create demo from a desk'"
    :submit-text="demo ? 'Save' : 'Create demo'"
    :pending="pending"
    :error="error"
    @submit="submit"
  >
    <v-select
      v-if="!demo"
      v-model="form.project"
      :items="desks"
      item-title="label"
      item-value="@rid"
      label="Desk"
      hint="A copy of this desk's files, sets, processes and tags is stored."
      persistent-hint
      variant="outlined"
      density="comfortable"
      class="mb-3"
    />
    <v-text-field
      v-model="form.titleEn"
      label="Title (English)"
      variant="outlined"
      density="comfortable"
    />
    <v-text-field
      v-model="form.titleFi"
      label="Title (Finnish)"
      variant="outlined"
      density="comfortable"
    />
    <v-textarea
      v-model="form.descriptionEn"
      label="Description (English)"
      rows="2"
      variant="outlined"
    />
    <v-textarea
      v-model="form.descriptionFi"
      label="Description (Finnish)"
      rows="2"
      variant="outlined"
    />
    <v-select
      v-model="form.serviceGroups"
      :items="groups"
      label="Service groups"
      multiple
      chips
      hint="Leave both lists empty to share with every user."
      persistent-hint
      variant="outlined"
      density="comfortable"
      class="mb-3"
    />
    <v-combobox
      v-model="form.users"
      label="Individual users (email)"
      multiple
      chips
      variant="outlined"
      density="comfortable"
    />
  </FormDialog>
</template>
