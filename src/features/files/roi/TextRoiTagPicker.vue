<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { tagColor } from './tagColors.js'

// A small popup next to a new passage: pick a tag of the desk, or make one. It can be ignored or
// closed (Escape): a passage does not need a tag.
const props = defineProps({
  tags: { type: Array, required: true },
  applied: { type: Array, default: () => [] },
  canCreate: { type: Boolean, default: true },
  position: { type: Object, default: () => ({ top: 0, left: 0 }) },
})
const emit = defineEmits(['pick', 'create', 'close'])

const query = ref('')
const input = ref(null)
const MAX = 8

const free = computed(() => props.tags.filter((t) => !props.applied.some((a) => a.rid === t.rid)))
const matches = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = q ? free.value.filter((t) => String(t.label).toLowerCase().includes(q)) : free.value
  return list.slice(0, MAX)
})
const exact = computed(() =>
  props.tags.some((t) => String(t.label).toLowerCase() === query.value.trim().toLowerCase()),
)
const mayCreate = computed(() => props.canCreate && query.value.trim() !== '' && !exact.value)

function submit() {
  if (matches.value.length) return emit('pick', matches.value[0])
  if (mayCreate.value) emit('create', query.value.trim())
}

onMounted(() => nextTick(() => input.value?.focus()))
</script>

<template>
  <div
    class="tag-pop"
    role="dialog"
    aria-label="Tag the passage"
    :style="{ top: `${position.top}px`, left: `${position.left}px` }"
    @mousedown.stop
    @mouseup.stop
    @keydown.esc.stop="emit('close')"
  >
    <input
      ref="input"
      v-model="query"
      class="tag-pop__input"
      type="text"
      placeholder="Tag… (Enter to apply)"
      aria-label="Search or create a tag"
      @keydown.enter.prevent="submit"
    />
    <ul class="tag-pop__list">
      <li v-for="tag in matches" :key="tag.rid">
        <button type="button" class="tag-pop__tag" @click="emit('pick', tag)">
          <span class="tag-pop__dot" :style="{ backgroundColor: tagColor(tag) }" />
          {{ tag.label }}
        </button>
      </li>
      <li v-if="mayCreate">
        <button type="button" class="tag-pop__tag tag-pop__tag--new" @click="submit">
          Create “{{ query.trim() }}”
        </button>
      </li>
      <li v-if="!matches.length && !mayCreate" class="tag-pop__empty">
        {{ canCreate ? 'Type to make a tag.' : 'No matching tag.' }}
      </li>
    </ul>
    <button type="button" class="tag-pop__close" @click="emit('close')">No tag</button>
  </div>
</template>

<style scoped>
.tag-pop {
  position: fixed;
  z-index: 5;
  width: 16rem;
  padding: var(--md-space-2);
  border: 1px solid var(--md-color-border, rgba(0, 0, 0, 0.2));
  border-radius: var(--md-radius-md);
  background: var(--md-color-surface);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.tag-pop__input {
  width: 100%;
  padding: var(--md-space-1) var(--md-space-2);
  border: 1px solid var(--md-color-border, rgba(0, 0, 0, 0.3));
  border-radius: var(--md-radius-sm);
  background: transparent;
  color: inherit;
  font: inherit;
}

.tag-pop__list {
  margin: var(--md-space-1) 0;
  padding: 0;
  list-style: none;
}

.tag-pop__tag,
.tag-pop__close {
  display: flex;
  align-items: center;
  gap: var(--md-space-2);
  width: 100%;
  padding: var(--md-space-1) var(--md-space-2);
  border: 0;
  border-radius: var(--md-radius-sm);
  background: none;
  color: inherit;
  font: inherit;
  font-size: var(--md-font-size-sm);
  text-align: start;
  cursor: pointer;
}

.tag-pop__tag:hover,
.tag-pop__tag:focus-visible,
.tag-pop__close:hover {
  background: var(--md-color-bg);
}

.tag-pop__tag--new {
  font-style: italic;
}

.tag-pop__close {
  color: var(--md-color-text-muted);
}

.tag-pop__dot {
  flex: 0 0 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
}

.tag-pop__empty {
  padding: var(--md-space-1) var(--md-space-2);
  font-size: var(--md-font-size-sm);
  color: var(--md-color-text-muted);
}
</style>
