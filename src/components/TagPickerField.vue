<template>
    <div>
        <v-btn-toggle v-model="mode" mandatory density="comfortable" variant="outlined" class="mb-2">
            <v-btn value="text" size="small">List categories</v-btn>
            <v-btn value="tags" size="small">Pick tags</v-btn>
        </v-btn-toggle>

        <template v-if="mode === 'text'">
            <input
                v-model="textValue"
                @input="emitText"
                type="text"
                class="form-control"
                placeholder="e.g. person, organization, location"
                aria-label="Categories"
            >
        </template>
        <template v-else>
            <v-autocomplete
                v-model="selectedRids"
                :items="tagOptions"
                item-title="title"
                item-value="value"
                label="Existing tags"
                multiple
                chips
                closable-chips
                clearable
                variant="outlined"
                @update:model-value="emitTags"
            >
                <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props" :subtitle="item.raw.description"></v-list-item>
                </template>
            </v-autocomplete>

            <!-- The cruncher only ever links back the tags picked here (see MessyDesk tags.md \u00a76):
                 no free-form labels are extracted when this mode is used. -->
            <v-expansion-panels variant="accordion" class="mb-2">
                <v-expansion-panel title="Define a new tag">
                    <v-expansion-panel-text>
                        <v-text-field v-model="newLabel" label="Label" density="compact"></v-text-field>
                        <v-text-field v-model="newDescription" label="Description (optional)" density="compact"></v-text-field>
                        <v-btn size="small" :loading="creating" @click="createTag">Create &amp; select</v-btn>
                    </v-expansion-panel-text>
                </v-expansion-panel>
            </v-expansion-panels>
        </template>
    </div>
</template>

<script setup>
    import { ref, onMounted, computed } from "vue";
    import web from "../web.js";

    const props = defineProps({
        modelValue: { type: [String, Array], default: '' }
    })
    const emit = defineEmits(['update:modelValue'])

    const mode = ref(Array.isArray(props.modelValue) ? 'tags' : 'text')
    const textValue = ref(typeof props.modelValue === 'string' ? props.modelValue : '')
    const selectedRids = ref([])
    const tags = ref([])
    const newLabel = ref('')
    const newDescription = ref('')
    const creating = ref(false)

    const tagOptions = computed(() => tags.value.map((tag) => ({
        value: tag.rid,
        title: tag.description ? `${tag.label} \u2014 ${tag.description}` : tag.label,
        description: tag.description,
    })))

    async function loadTags() {
        const response = await web.getTags()
        tags.value = (response?.result || []).map((tag) => ({
            rid: tag.rid,
            label: tag.label,
            description: tag.description || ''
        }))
    }

    function emitText() {
        emit('update:modelValue', textValue.value)
    }

    function emitTags() {
        const entries = selectedRids.value
            .map((rid) => tags.value.find((tag) => tag.rid === rid))
            .filter(Boolean)
            .map((tag) => ({ label: tag.label, description: tag.description }))
        emit('update:modelValue', entries)
    }

    async function createTag() {
        const label = newLabel.value.trim()
        if (!label) return
        creating.value = true
        try {
            await web.createTag(label, newDescription.value.trim())
            await loadTags()
            const created = tags.value.find((tag) => tag.label === label)
            if (created && !selectedRids.value.includes(created.rid)) {
                selectedRids.value.push(created.rid)
                emitTags()
            }
            newLabel.value = ''
            newDescription.value = ''
        } finally {
            creating.value = false
        }
    }

    onMounted(loadTags)
</script>
