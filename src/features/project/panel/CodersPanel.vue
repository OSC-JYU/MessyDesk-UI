<script setup>
import { computed, reactive, watch } from 'vue'
import { addCoder, copyCodingSet, exportCoding, getCoders, getUserNames, lockCoder, removeCoder } from '@/api/coding.js'
import ErrorAlert from '@/ui/ErrorAlert.vue'

// The people who may code in a ROI set. Each sees only this set and the texts in it, and can mark
// passages and tag them with the desk's tags. A locked coder can read, not change.
const props = defineProps({
  setRid: { type: String, required: true },
  deskRid: { type: String, default: '' },
})

const state = reactive({ coders: [], users: [], pick: null, loading: false, error: null })
const options = computed(() =>
  state.users
    .filter((u) => !state.coders.some((c) => c.user_rid === u.rid))
    .map((u) => ({ value: u.rid, title: u.name })),
)

async function load() {
  state.loading = true
  state.error = null
  try {
    const [coders, users] = await Promise.all([getCoders(props.setRid), getUserNames()])
    state.coders = coders || []
    state.users = users || []
  } catch (error) {
    state.error = error
  } finally {
    state.loading = false
  }
}

async function run(action) {
  state.error = null
  try {
    await action()
    state.coders = (await getCoders(props.setRid)) || []
  } catch (error) {
    state.error = error
  }
}

const copy = reactive({ pending: false, message: '' })
async function makeCopy() {
  copy.pending = true
  copy.message = ''
  try {
    const result = await copyCodingSet(props.setRid, 'Final')
    copy.message = `Made “${result.label}” with ${result.passages} passages. It is on the desk.`
  } catch (error) {
    state.error = error
  } finally {
    copy.pending = false
  }
}

// Downloads the passages of this set (JSON for analysis, CSV for a spreadsheet).
async function download(format) {
  state.error = null
  try {
    const blob = await exportCoding(props.deskRid, { roiSet: props.setRid, format })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = format === 'csv' ? 'coding.csv' : 'coding.coding.json'
    link.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    state.error = error
  }
}

async function add() {
  if (!state.pick) return
  const rid = state.pick
  state.pick = null
  await run(() => addCoder(props.setRid, rid))
}

watch(() => props.setRid, load, { immediate: true })
</script>

<template>
  <section class="coders" aria-label="Coders">
    <h4 class="coders__title">Coders</h4>
    <p class="coders__hint">
      A coder sees only this set and its texts, and codes with the tags of this desk.
    </p>
    <ErrorAlert :error="state.error" title="Coders" class="mb-2" />
    <ul class="coders__list">
      <li v-for="coder in state.coders" :key="coder.user_rid" class="coders__item">
        <span class="coders__name">{{ coder.name }}</span>
        <v-chip v-if="coder.locked" size="x-small" label>Locked</v-chip>
        <span
          v-if="coder.progress"
          class="coders__progress"
          :title="`${coder.progress.passages} passages, ${coder.progress.untagged} without tags`"
        >
          {{ coder.progress.with_passages }}/{{ coder.progress.texts }}
        </span>
        <v-btn
          size="x-small"
          variant="text"
          :prepend-icon="coder.locked ? 'mdi-lock-open-outline' : 'mdi-lock-outline'"
          @click="run(() => lockCoder(setRid, coder.user_rid, !coder.locked))"
        >
          {{ coder.locked ? 'Unlock' : 'Lock' }}
        </v-btn>
        <v-btn
          icon="mdi-close"
          size="x-small"
          variant="text"
          :aria-label="`Remove ${coder.name}`"
          @click="run(() => removeCoder(setRid, coder.user_rid))"
        />
      </li>
    </ul>
    <div class="coders__add">
      <v-autocomplete
        v-model="state.pick"
        :items="options"
        label="Add a coder"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        data-test="coder-pick"
      />
      <v-btn size="small" variant="tonal" :disabled="!state.pick" @click="add">Add</v-btn>
    </div>
    <div class="coders__actions">
      <v-btn size="small" variant="text" :loading="copy.pending" @click="makeCopy">
        Copy as a final set
      </v-btn>
      <v-btn v-if="deskRid" size="small" variant="text" @click="download('json')">Export JSON</v-btn>
      <v-btn v-if="deskRid" size="small" variant="text" @click="download('csv')">Export CSV</v-btn>
    </div>
    <p v-if="copy.message" class="coders__hint" role="status">{{ copy.message }}</p>
  </section>
</template>

<style scoped>
.coders {
  margin-block-start: var(--md-space-3);
}

.coders__title {
  margin: 0;
  font-size: var(--md-font-size-sm);
  font-weight: 600;
}

.coders__hint {
  margin: var(--md-space-1) 0 var(--md-space-2);
  color: var(--md-color-text-muted);
  font-size: var(--md-font-size-sm);
}

.coders__list {
  margin: 0 0 var(--md-space-2);
  padding: 0;
  list-style: none;
}

.coders__item {
  display: flex;
  align-items: center;
  gap: var(--md-space-1);
}

.coders__name {
  flex: 1 1 auto;
}

.coders__progress {
  color: var(--md-color-text-muted);
  font-size: var(--md-font-size-sm);
}

.coders__actions {
  display: flex;
  flex-wrap: wrap;
  margin-block-start: var(--md-space-2);
}

.coders__add {
  display: flex;
  gap: var(--md-space-2);
  align-items: center;
}
</style>
