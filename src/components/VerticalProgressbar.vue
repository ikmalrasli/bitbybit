<script setup>
import { computed } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: true
  },
  color: {
    type: String,
    default: 'text-primary'
  },
  percent: {
    type: Number,
    default: 0
  }
});
</script>

<template>
  <div class="progress bg-gray-200">
        <!-- Progress bar fill -->
        <div :class="[color, 'progress__fill']" :style="{ height: `${props.percent}%` }"></div>
    </div>
</template>

<style scoped>
.progress {
    width: 20px;
    height: 100px;
    position: relative;
    border-radius: 8px;
    overflow: hidden;
}
/* make the progress bar fill from bottom to top */

.progress__fill {
    width: 100%;
    border-radius: 8px;
    position:absolute;
    bottom: 0;
}
</style>
