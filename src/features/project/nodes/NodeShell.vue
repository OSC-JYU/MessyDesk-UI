<script setup>
import { Handle, Position, useNode } from '@vue-flow/core'
import cookieIcon from '@/assets/images/cookie-bite-solid_blue.svg'
import { useWorkspace } from '../useWorkspace.js'

// Frame shared by all graph nodes: a coloured header with the label, the
// cookie that opens the crunchers, and the connection handles.
defineProps({
  label: { type: String, default: '' },
  kind: { type: String, default: 'file' }, // file | image | set | process | source | roi | zip | error
  icon: { type: String, default: '' },
  crunchable: { type: Boolean, default: false },
  wide: { type: Boolean, default: false },
})

const { node } = useNode()
const workspace = useWorkspace()

function crunch(filter = '') {
  workspace.openCrunchers(node, filter)
}

defineExpose({ crunch })
</script>

<template>
  <div class="gnode" :class="[`gnode--${kind}`, { 'gnode--wide': wide }]">
    <header class="gnode__header">
      <v-icon v-if="icon" :icon="icon" size="18" aria-hidden="true" />
      <span class="gnode__label" :title="label">{{ label }}</span>
      <slot name="header" />
    </header>
    <button
      v-if="crunchable"
      type="button"
      class="gnode__crunch nodrag"
      title="Add cruncher"
      @click.stop="crunch('')"
    >
      <img :src="cookieIcon" alt="Add cruncher" />
    </button>
    <div class="gnode__body">
      <slot :crunch="crunch" />
    </div>
    <Handle id="a" type="target" :position="Position.Left" />
    <Handle id="b" type="source" :position="Position.Right" />
    <slot name="handles" />
  </div>
</template>

<style scoped>
.gnode {
  --kind: var(--md-color-header);
  position: relative;
  width: var(--md-node-width);
  min-height: calc(var(--md-space-7) * 2.5);
  border: 1px solid var(--md-color-border);
  border-radius: var(--md-radius-md);
  background: var(--md-color-surface);
  box-shadow: var(--md-shadow-2);
  color: var(--md-color-text);
  font-size: var(--md-font-size-xs);
  text-align: start;
}

.gnode--wide {
  width: var(--md-node-width-wide);
}

.gnode--image {
  --kind: var(--md-color-graph);
}

.gnode--set,
.gnode--roi {
  --kind: var(--md-color-teal);
}

.gnode--source {
  --kind: var(--md-color-warning);
}

.gnode--zip {
  --kind: var(--md-color-text-muted);
}

.gnode--error {
  --kind: var(--md-color-error);
}

.gnode--process {
  border: 0;
  background: var(--md-gradient-graph);
  color: var(--md-color-text-on-dark);
}

.gnode__header {
  display: flex;
  align-items: center;
  gap: var(--md-space-2);
  padding: var(--md-space-2) var(--md-space-3);
  border-radius: var(--md-radius-md) var(--md-radius-md) 0 0;
  background: var(--kind);
  color: var(--md-color-text-on-dark);
  font-size: var(--md-font-size-sm);
  font-weight: var(--md-font-weight-bold);
}

.gnode--process .gnode__header {
  justify-content: center;
  background: transparent;
  font-family: var(--md-font-title);
  font-size: var(--md-font-size-lg);
  font-weight: var(--md-font-weight-regular);
}

.gnode__label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gnode__body {
  max-height: var(--md-node-body-max-height);
  overflow: hidden;
  padding: var(--md-space-2) var(--md-space-3) var(--md-space-3);
}

.gnode__crunch {
  position: absolute;
  top: calc(var(--md-space-6) * -1);
  right: calc(var(--md-space-6) * -1);
  width: var(--md-node-cookie-size);
  height: var(--md-node-cookie-size);
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.gnode__crunch:hover,
.gnode__crunch:focus-visible {
  transform: scale(1.1);
}

.gnode__crunch img {
  width: 100%;
  height: 100%;
}

.gnode :deep(pre) {
  margin: 0;
  font-family: var(--md-font-mono);
  font-size: var(--md-font-size-xs);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
