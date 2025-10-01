<template>
  <div class="relative">
    <button
      @click="toggleCalendar"
      class="w-full px-4 py-2 text-gray-700 bg-white border rounded-lg focus:outline-none focus:border-violet-500 hover:bg-gray-50 transition duration-150 ease-in-out"
    >
      {{ formattedDate || 'No End' }}
      <i class="fa-solid fa-calendar inline-block w-5 h-5 ml-2 text-gray-400"></i>
    </button>

    <Teleport to="body">
      <div v-if="showCalendar" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="fixed inset-0 items-center flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75" aria-hidden="true" @click="toggleCalendar"></div>

          <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          <div
            class="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-sm sm:w-full"
          >
            <div class="p-4 bg-white sm:p-6 sm:pb-4">
              <div class="sm:flex sm:items-start">
                <div class="w-full ">
                  <div class="flex justify-between">
                      <h3 class="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                        Select a Date
                      </h3>
                      <span class="material-icons cursor-pointer" @click="toggleCalendar">close</span>
                  </div>
                  
                  <div class="mt-4">
                    <div class="flex justify-between items-center mb-4">
                      <button @click="previousMonth" class="text-gray-600 hover:text-gray-800">
                        <i class="fa-solid fa-chevron-left w-5 h-5"></i>
                      </button>
                      <h2 class="text-lg font-semibold text-gray-800">{{ currentMonthYear }}</h2>
                      <button @click="nextMonth" class="text-gray-600 hover:text-gray-800">
                        <i class="fa-solid fa-chevron-right w-5 h-5"></i>
                      </button>
                    </div>

                    <div class="grid grid-cols-7 gap-1 mb-2">
                      <div v-for="day in daysOfWeek" :key="day" class="text-center text-sm font-medium text-gray-700">
                        {{ day }}
                      </div>
                    </div>

                    <div class="grid grid-cols-7 gap-1">
                      <button
                        v-for="{ date, isCurrentMonth, isToday, isSelected } in calendarDays"
                        :key="date.toISOString()"
                        @click="selectDate(date)"
                        :class="[
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm',
                          isCurrentMonth ? 'text-gray-700 hover:bg-violet-100' : 'text-gray-400',
                          isToday && !isSelected && selectedDate? 'bg-violet-100' : '',
                          isSelected ? 'bg-violet-500 text-white hover:bg-violet-600' : '',
                        ]"
                        :disabled="!isCurrentMonth"
                      >
                        {{ date.getDate() }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
              <button v-if="props.reset && selectedDate"
                type="button"
                class="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-violet-600 border border-transparent rounded-md shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 sm:ml-3 sm:w-auto sm:text-sm"
                @click="resetDate"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['update:modelValue'])

const props = defineProps({
  modelValue: {
    type: Date,
    default: null // Changed to null for initial empty state
  },
  reset: {
    type: Boolean,
    default: false
  }
})

const currentDate = ref(new Date())
const selectedDate = ref(props.modelValue)
const showCalendar = ref(false)

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const currentMonthYear = computed(() => {
  return currentDate.value.toLocaleString('default', { month: 'long', year: 'numeric' })
})

const formattedDate = computed(() => {
  return selectedDate.value
    ? selectedDate.value.toLocaleDateString('en-CA')
    : '' // Empty string if no date is selected
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const days = []

  // Add days from previous month
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    days.push({ date, isCurrentMonth: false, isToday: isToday(date), isSelected: isSameDate(date, selectedDate.value) })
  }

  // Add days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i)
    days.push({ date, isCurrentMonth: true, isToday: isToday(date), isSelected: isSameDate(date, selectedDate.value) })
  }

  // Add days from next month
  const remainingDays = 42 - days.length // 6 rows * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i)
    days.push({ date, isCurrentMonth: false, isToday: isToday(date), isSelected: isSameDate(date, selectedDate.value) })
  }

  return days
})

function toggleCalendar() {
  showCalendar.value = !showCalendar.value
}

function previousMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

function selectDate(date) {
  selectedDate.value = date
  emit('update:modelValue', date)
  toggleCalendar()
}

function resetDate() {
  selectedDate.value = null
  emit('update:modelValue', null)
  toggleCalendar()
}

function isToday(date) {
  const today = new Date()
  return isSameDate(date, today)
}

function isSameDate(date1, date2) {
  return date1 && date2 && date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear()
}
</script>