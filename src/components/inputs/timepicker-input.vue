<template>
  <div class="relative">
    <input
      type="text"
      :value="formattedTime"
      @focus="showPicker = true"
      readonly
      class="w-full px-4 py-2 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Select time"
    />
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div v-if="showPicker" class="absolute z-10 mt-1 w-64 bg-white rounded-lg shadow-lg">
        <div class="p-4">
          <div class="flex justify-between items-center mb-4">
            <button @click="showPicker = false" class="text-blue-500 hover:text-blue-600 focus:outline-none">
              Cancel
            </button>
            <button @click="confirmTime" class="text-blue-500 hover:text-blue-600 focus:outline-none">
              Done
            </button>
          </div>
          <div class="flex border border-red-400 justify-center overflow-hidden h-32">
            <div class="flex flex-col mx-2 overflow-y-scroll scrollbar-hide" ref="hourPicker">
              <div v-for="h in 24" :key="`hour-${h}`" class="py-2 px-4 text-center cursor-pointer hover:bg-gray-100"
                :class="{ 'text-blue-500 font-bold': selectedHour === h - 1 }"
                @click="setHour(h - 1)">
                {{ (h - 1).toString().padStart(2, '0') }}
              </div>
            </div>
            <div class="flex flex-col mx-2 overflow-y-scroll scrollbar-hide" ref="minutePicker">
              <div v-for="m in 60" :key="`minute-${m}`" class="py-2 px-4 text-center cursor-pointer hover:bg-gray-100"
                :class="{ 'text-blue-500 font-bold': selectedMinute === m - 1 }"
                @click="setMinute(m - 1)">
                {{ (m - 1).toString().padStart(2, '0') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

const showPicker = ref(false);
const selectedHour = ref(0);
const selectedMinute = ref(0);
const hourPicker = ref(null);
const minutePicker = ref(null);

const formattedTime = computed(() => {
  return `${selectedHour.value.toString().padStart(2, '0')}:${selectedMinute.value.toString().padStart(2, '0')}`;
});

const setHour = (hour) => {
  selectedHour.value = hour;
};

const setMinute = (minute) => {
  selectedMinute.value = minute;
};

const confirmTime = () => {
  showPicker.value = false;
  emit('timeChange', formattedTime.value);
};

const scrollToSelected = (element, selectedValue) => {
  if (element.value) {
    const scrollPosition = selectedValue * 40; // 40px is the height of each time option
    element.value.scrollTop = scrollPosition - 60; // Center the selected value
  }
};

onMounted(() => {
  scrollToSelected(hourPicker, selectedHour.value);
  scrollToSelected(minutePicker, selectedMinute.value);
});

watch(showPicker, (newValue) => {
  if (newValue) {
    scrollToSelected(hourPicker, selectedHour.value);
    scrollToSelected(minutePicker, selectedMinute.value);
  }
});

const emit = defineEmits(['timeChange']);
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>