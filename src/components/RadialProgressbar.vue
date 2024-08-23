<script setup>
import { computed } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: true
  },
  size: {
    type: Number,
    default: 60 // Keep the default size for fallback, but it won't be fixed.
  },
  color: {
    type: String,
    default: 'text-primary'
  },
  radius: {
    type: Number,
    default: 40
  },
  progress: {
    type: Number,
    default: 0
  },
  datenumber: {
    type: String,
    default: 0
  }
});

const strokeWidth = 10;
const clampedProgress = computed(() => Math.min(100, Math.max(0, props.progress)));
const circumference = computed(() => Number((2 * Math.PI * props.radius).toFixed(1)));
const strokeDashOffset = computed(() => circumference.value - (circumference.value * clampedProgress.value) / 100);
const viewBoxSize = computed(() => props.radius * 2 + strokeWidth * 2);
</script>

<template>
  <div class="h-full w-full flex items-center justify-center">
    <svg
      class="w-full h-full"
      :viewBox="`0 0 ${viewBoxSize} ${viewBoxSize}`"
      preserveAspectRatio="xMidYMid meet"
    >
      <circle
        v-if="props.show"
        class="text-gray-200 stroke-current"
        :stroke-width="strokeWidth"
        :cx="viewBoxSize / 2"
        :cy="viewBoxSize / 2"
        :r="props.radius"
        fill="transparent"
      />
      <circle
        v-if="props.show"
        class="progress-ring_circle stroke-current"
        :class="color"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        :cx="viewBoxSize / 2"
        :cy="viewBoxSize / 2"
        :r="props.radius"
        fill="transparent"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="strokeDashOffset"
      />
      <text
        :x="viewBoxSize / 2"
        :y="viewBoxSize / 2"
        font-size="32"
        text-anchor="middle"
        alignment-baseline="middle"
      >
        {{ props.datenumber }}
      </text>
    </svg>
  </div>
</template>

<style scoped>
.progress-ring_circle {
  transition: stroke-dashoffset 0.35s;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
}
</style>
