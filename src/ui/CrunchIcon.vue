<script setup>
import { useId } from 'vue'

// The cruncher icon: a bitten cookie with crumbs flying off the bite and a
// small "+" (add a cruncher). Inside a button, hovering takes another bite:
// the cookie wobbles and the crumbs jump.
defineProps({
  size: { type: [Number, String], default: 44 },
  plus: { type: Boolean, default: true },
})

const maskId = `crunch-bite-${useId()}`
</script>

<template>
  <svg
    class="crunch-icon"
    :width="size"
    :height="size"
    viewBox="0 0 48 48"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <mask :id="maskId">
        <rect width="48" height="48" fill="white" />
        <!-- the bite: three overlapping tooth marks -->
        <circle cx="37" cy="9" r="6.5" fill="black" />
        <circle cx="42.5" cy="15" r="5.5" fill="black" />
        <circle cx="31.5" cy="5" r="4.5" fill="black" />
      </mask>
    </defs>

    <g class="crunch-icon__cookie">
      <g :mask="`url(#${maskId})`">
        <circle cx="23" cy="25" r="19" class="crunch-icon__dough" />
        <circle cx="23" cy="25" r="19" class="crunch-icon__rim" />
        <path class="crunch-icon__chip" d="M13.5 18.5l3.2-1.2 1.4 3-2.8 1.8z" />
        <path class="crunch-icon__chip" d="M24 14.8l2.9.4-.4 3.1-3-.6z" />
        <path class="crunch-icon__chip" d="M12.8 29.4l3.3.5-.7 3.2-3.1-1z" />
        <path class="crunch-icon__chip" d="M22.4 25.2l3.4-.9 1 3.1-3.3 1z" />
        <path class="crunch-icon__chip" d="M30.5 30.6l3-.8.8 3-3.1.8z" />
        <path class="crunch-icon__chip" d="M20.6 36.4l3 .3-.3 3-3-.4z" />
        <path class="crunch-icon__chip" d="M33.2 20.2l2.8.7-.7 2.8-2.8-.8z" />
      </g>
    </g>

    <g class="crunch-icon__crumbs">
      <path class="crunch-icon__crumb crunch-icon__crumb--1" d="M40.6 4.2l2.3-.8.5 2.2-2.1.9z" />
      <path class="crunch-icon__crumb crunch-icon__crumb--2" d="M45 9.4l1.9.2-.2 1.9-1.9-.3z" />
      <path class="crunch-icon__crumb crunch-icon__crumb--3" d="M44.2 22.2l1.6-.6.6 1.5-1.6.6z" />
    </g>

    <g v-if="plus" class="crunch-icon__plus">
      <circle cx="37" cy="38" r="9" />
      <path d="M37 33.5v9M32.5 38h9" />
    </g>
  </svg>
</template>

<style scoped>
.crunch-icon {
  display: block;
  overflow: visible;
}

.crunch-icon__dough {
  fill: var(--md-color-cookie);
}

.crunch-icon__rim {
  fill: none;
  stroke: var(--md-color-cookie-edge);
  stroke-width: 2;
}

.crunch-icon__chip {
  fill: var(--md-color-cookie-chip);
}

.crunch-icon__crumb {
  fill: var(--md-color-cookie-edge);
}

.crunch-icon__plus circle {
  fill: var(--md-color-primary);
  stroke: var(--md-color-surface);
  stroke-width: 2.5;
}

.crunch-icon__plus path {
  stroke: var(--md-color-on-primary);
  stroke-width: 2.6;
  stroke-linecap: round;
}

.crunch-icon__cookie,
.crunch-icon__crumb {
  transform-box: fill-box;
  transform-origin: center;
}

/* Another bite when the button it sits in is hovered or focused. */
:global(:is(button, a):is(:hover, :focus-visible)) > .crunch-icon .crunch-icon__cookie {
  animation: crunch-wobble 0.45s ease-in-out;
}

:global(:is(button, a):is(:hover, :focus-visible)) > .crunch-icon .crunch-icon__crumb--1 {
  animation: crunch-crumb-1 0.5s ease-out;
}

:global(:is(button, a):is(:hover, :focus-visible)) > .crunch-icon .crunch-icon__crumb--2 {
  animation: crunch-crumb-2 0.5s ease-out 0.05s;
}

:global(:is(button, a):is(:hover, :focus-visible)) > .crunch-icon .crunch-icon__crumb--3 {
  animation: crunch-crumb-3 0.5s ease-out 0.1s;
}

@keyframes crunch-wobble {
  0%,
  100% {
    transform: rotate(0deg) scale(1);
  }
  30% {
    transform: rotate(-8deg) scale(0.96);
  }
  60% {
    transform: rotate(5deg) scale(1.02);
  }
}

@keyframes crunch-crumb-1 {
  50% {
    transform: translate(3px, -4px) rotate(40deg);
  }
}

@keyframes crunch-crumb-2 {
  50% {
    transform: translate(4px, -1px) rotate(-50deg);
  }
}

@keyframes crunch-crumb-3 {
  50% {
    transform: translate(3px, 3px) rotate(60deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .crunch-icon * {
    animation: none !important;
  }
}
</style>
