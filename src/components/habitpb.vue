<template>
  <div class="progress h-16 bg-white border rounded-lg shadow-sm py-2 px-4 hover:bg-gray-50 active:bg-gray-100">
    <div class="flex justify-between items-center" style="min-height: 26px;">
      <!-- Task title -->
      <span class="truncate max-w-xs whitespace-nowrap overflow-hidden">{{ text }}</span>

      <!-- Container for either the check icon or timesdone -->
      <div class="flex items-center">
        <div v-if="percent === 100">
          <span class="material-icons" style="font-size: 24px;">check</span>
        </div>
        <div v-else>
          <span>{{ timesdone }}</span>
        </div>
      </div>
    </div>

    <!-- Progress bar background and fill -->
    <div class="relative h-2 mt-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        :class="color"
        class="absolute h-full left-0 top-0 rounded-full"
        :style="{ width: `${percent}%` }"
      ></div>
    </div>
  </div>
</template>

<script setup>
// Define component props
const props = defineProps({
  color: {
    type: String,
    default: 'bg-blue-500'
  },
  text: {
    type: String,
    default: ""
  },
  percent: {
    type: Number,
    default: 0
  },
  timesdone: {
    type: String,
    default: '0/0'
  }
});
</script>

<style scoped>
.progress {
  width: 100%;
  position: relative;
}
.material-icons {
  vertical-align: middle;
}
</style>
  