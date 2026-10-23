<script setup>
import { ref, watch } from 'vue'
import CrunchIcon from './CrunchIcon.vue'

// A thumbnail image that falls back to a themed placeholder while the backend
// has no preview yet (it answers 404 until a thumbnailer has made one). When
// `src` changes, e.g. a new version after the thumbnail is ready, it tries
// again.
const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  lazy: { type: Boolean, default: false },
  // Leave out the "not ready" text where there is little room.
  compact: { type: Boolean, default: false },
})

const failed = ref(false)
watch(
  () => props.src,
  () => (failed.value = false),
)
</script>

<template>
  <img
    v-if="src && !failed"
    :src="src"
    :alt="alt"
    :loading="lazy ? 'lazy' : undefined"
    draggable="false"
    class="thumbnail"
    @error="failed = true"
  />
  <div
    v-else
    class="thumbnail thumbnail--pending"
    :class="{ 'thumbnail--compact': compact }"
    role="img"
    :aria-label="alt ? `${alt}: preview not ready yet` : 'Preview not ready yet'"
  >
    <span class="thumbnail__baking" aria-hidden="true">
      <svg class="thumbnail__steam" viewBox="0 0 30 14">
        <path d="M6 13c-2-3 2-5 0-8s2-4 1-5" />
        <path d="M15 13c-2-3 2-5 0-8s2-4 1-5" />
        <path d="M24 13c-2-3 2-5 0-8s2-4 1-5" />
      </svg>
      <CrunchIcon :size="compact ? 28 : 40" :plus="false" />
    </span>
    <span v-if="!compact" class="thumbnail__text">Preview not ready yet</span>
  </div>
</template>

<style scoped>
.thumbnail {
  display: block;
  width: 100%;
  border-radius: var(--md-radius-sm);
}

.thumbnail--pending {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--md-space-2);
  aspect-ratio: 4 / 3;
  padding: var(--md-space-3);
  border: 1px dashed var(--md-color-border);
  background: var(--md-color-bg);
  color: var(--md-color-text-muted);
  text-align: center;
}

.thumbnail--compact {
  aspect-ratio: 1;
  padding: var(--md-space-1);
}

.thumbnail__baking {
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0.85;
}

.thumbnail__steam {
  width: 30%;
  min-width: 18px;
  max-width: 30px;
  margin-block-end: calc(var(--md-space-1) * -1);
  overflow: visible;
}

.thumbnail__steam path {
  fill: none;
  stroke: var(--md-color-text-muted);
  stroke-width: 1.6;
  stroke-linecap: round;
  opacity: 0;
  animation: thumbnail-steam 2.4s ease-in-out infinite;
}

.thumbnail__steam path:nth-child(2) {
  animation-delay: 0.8s;
}

.thumbnail__steam path:nth-child(3) {
  animation-delay: 1.6s;
}

.thumbnail__text {
  font-size: var(--md-font-size-xs);
  line-height: 1.3;
}

@keyframes thumbnail-steam {
  0% {
    opacity: 0;
    transform: translateY(3px);
  }
  40% {
    opacity: 0.8;
  }
  100% {
    opacity: 0;
    transform: translateY(-3px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .thumbnail__steam path {
    animation: none;
    opacity: 0.6;
  }
}

/* Settings → Reduce motion: still steam. */
[data-motion='off'] .thumbnail__steam path {
  opacity: 0.6;
}
</style>
