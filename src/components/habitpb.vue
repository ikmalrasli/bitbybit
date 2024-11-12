<template>
  <div class="progress min-h-16 bg-white border rounded-lg shadow-sm py-2 px-4 hover:bg-gray-50 active:bg-gray-100"
  @click="selectionMode ? $emit('toggleSelect') : $emit('openDetail')">

    <div class="flex flex-row items-center">
    <!-- Checkbox visible only in selection mode -->
    <div v-if="selectionMode" class="mr-4">
        <!-- Custom circular checkbox -->
        <label class="flex items-center cursor-pointer relative">
          <input 
            type="checkbox" 
            :checked="isSelected" 
            @change.stop="$emit('toggleSelect')" 
            class="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded-full bg-white hover:shadow-md border border-slate-300 checked:bg-violet-400 checked:border-violet-400"
          />
          <span class="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" stroke-width="1">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
          </span>
        </label>
      </div>

    <div class="flex flex-col flex-grow">
      <div class="flex justify-between items-center gap-2" style="min-height: 26px;">
        <!-- Task title -->
        <span class="overflow-hidden">{{ text }}</span>

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
  },
  selectionMode: {
    type: Boolean,
    default: false
  },
  isSelected: { 
    type: Boolean, 
    default: false 
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
  