<script setup>
import { computed, reactive, watch } from 'vue'
import { getNodeFile } from '@/api/files.js'
import DisplayFrame from './DisplayFrame.vue'
import { useFileContent } from '../useFileContent.js'
import { confidenceLabel, confidenceLevel, excerpt, parseFields } from '../fields.js'
import { toRid } from '../fileTypes.js'

// Extracted fields (fields.json) as a table: a column per field, a row per record. Picking a value
// shows where it is in the source text.
const props = defineProps({ file: { type: Object, required: true } })
const { state } = useFileContent(() => props.file)

const parsed = computed(() => {
  if (!state.content) return null
  try {
    return parseFields(state.content)
  } catch {
    return null
  }
})
const picked = reactive({ row: -1, field: null })
const source = reactive({ text: null, loading: false, error: null })
const value = computed(() =>
  picked.field ? parsed.value?.records[picked.row]?.[picked.field] : null,
)
const context = computed(() => excerpt(source.text, value.value))

watch(
  () => props.file['@rid'],
  () => {
    Object.assign(picked, { row: -1, field: null })
    Object.assign(source, { text: null, error: null })
  },
)

async function pick(row, field) {
  Object.assign(picked, { row, field })
  const rid = toRid(parsed.value?.source?.rid)
  if (source.text !== null || source.loading || !rid) return
  source.loading = true
  try {
    const content = await getNodeFile(rid)
    source.text = typeof content === 'string' ? content : String(content)
  } catch (error) {
    source.error = error
  } finally {
    source.loading = false
  }
}
</script>

<template>
  <DisplayFrame :loading="state.loading" :error="state.error">
    <p v-if="!parsed" class="fields__muted">This file is not a readable fields file.</p>
    <div v-else class="fields">
      <p v-if="!parsed.records.length" class="fields__muted">No values were found in the text.</p>
      <v-table v-else density="compact" class="fields__table">
        <thead>
          <tr>
            <th v-if="parsed.records.length > 1" class="fields__index">#</th>
            <th v-for="field in parsed.fields" :key="field">{{ field }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(record, row) in parsed.records" :key="row">
            <td v-if="parsed.records.length > 1" class="fields__index">{{ row + 1 }}</td>
            <td v-for="field in parsed.fields" :key="field">
              <button
                v-if="record[field]"
                type="button"
                :class="[
                  'fields__value',
                  { 'fields__value--active': picked.row === row && picked.field === field },
                ]"
                :title="record[field].start !== null ? 'Show in the text' : ''"
                @click="pick(row, field)"
              >
                <span>{{ record[field].text }}</span>
                <span
                  v-if="record[field].confidence !== null"
                  :class="[
                    'fields__confidence',
                    `fields__confidence--${confidenceLevel(record[field].confidence)}`,
                  ]"
                  >{{ confidenceLabel(record[field].confidence) }}</span
                >
              </button>
              <span v-else class="fields__muted">–</span>
            </td>
          </tr>
        </tbody>
      </v-table>

      <section v-if="value" class="fields__context">
        <h3 class="fields__heading">
          {{ picked.field }}
          <span v-if="parsed.source?.label" class="fields__muted"
            >in {{ parsed.source.label }}</span
          >
        </h3>
        <v-progress-linear v-if="source.loading" indeterminate color="primary" />
        <p v-else-if="source.error" class="fields__muted">The source text could not be loaded.</p>
        <p v-else-if="context" class="fields__excerpt">
          {{ context.before }}<mark class="fields__mark">{{ context.match }}</mark
          >{{ context.after }}
        </p>
        <p v-else-if="source.text !== null" class="fields__muted">
          The place of this value in the text is not known.
        </p>
      </section>
    </div>
  </DisplayFrame>
</template>

<style scoped>
.fields {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-4);
}

.fields__table th {
  font-weight: var(--md-font-weight-medium);
  white-space: nowrap;
}

.fields__index {
  width: 1%;
  color: var(--md-color-text-muted);
}

.fields__value {
  display: inline-flex;
  align-items: baseline;
  gap: var(--md-space-2);
  padding: var(--md-space-1) var(--md-space-2);
  border-radius: var(--md-radius-sm);
  text-align: start;
  cursor: pointer;
}

.fields__value:hover,
.fields__value--active {
  background: color-mix(in srgb, var(--md-color-primary) 12%, transparent);
}

.fields__confidence {
  font-size: var(--md-font-size-xs);
  color: var(--level);
  white-space: nowrap;
}

.fields__confidence--high {
  --level: var(--md-color-success);
}

.fields__confidence--medium {
  --level: var(--md-color-warning);
}

.fields__confidence--low,
.fields__confidence--unknown {
  --level: var(--md-color-error);
}

.fields__context {
  padding: var(--md-space-4);
  border: 1px solid var(--md-color-border);
  border-radius: var(--md-radius-sm);
  background: var(--md-color-surface);
}

.fields__heading {
  display: flex;
  gap: var(--md-space-2);
  margin: 0 0 var(--md-space-2);
  font-size: var(--md-font-size-md);
}

.fields__excerpt {
  margin: 0;
  line-height: 1.7;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.fields__mark {
  padding: 0 var(--md-space-1);
  border-radius: var(--md-radius-sm);
  background: color-mix(in srgb, var(--md-color-primary) 25%, transparent);
  color: inherit;
}

.fields__muted {
  color: var(--md-color-text-muted);
}
</style>
