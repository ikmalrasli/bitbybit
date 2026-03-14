<template>
  <div class="flex flex-col bg-white rounded-lg text-center space-y-2">
    <div class="border rounded-lg p-2">
      <div class="w-full flex text-center items-center mb-4">
        <span class="w-full font-semibold text-lg text-center">{{ currentMonthName }} {{ store.year }}</span>
      </div>

      <div class="w-full grid grid-cols-7 text-black mb-2 gap-x-1">
        <div v-for="day in daysOfWeek" :key="day" class="flex-1 text-xs font-bold text-gray-400 uppercase">
          {{ day }}
        </div>
      </div>

      <div v-if="!loading" class="grid grid-cols-7 text-center gap-x-1">
        <div v-for="(day, index) in calendarDays" :key="index" class="relative p-2 rounded-full">
          <div class="flex flex-col items-center">
            <RadialProgressbar 
              :show="day.isCurrentMonth && day.isScheduled" 
              :progress="day.progress" 
              :radius="40" 
              :text="String(day.day)"
              :textcolor="day.isCurrentMonth ? '#000000' : '#9ca3af'" 
              :textsize="36" 
              :strokeWidth="5"
              :color="fillColor" 
              :isPaused="day.isPaused" />
            
            <div class="h-1 w-1 md:h-2 md:w-2" :class="[{ 'invisible': !day.isToday }, fillClass]">
              <svg class="h-full w-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="grid grid-cols-7 gap-2 p-4 animate-pulse">
        <div v-for="i in 30" :key="i" class="h-8 w-8 bg-gray-100 rounded-full mx-auto"></div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-4 p-4 w-full border rounded-lg">
      <div class="flex flex-col items-center justify-center">
        <div class="flex flex-row space-x-1 items-center">
          <span class="material-icons text-sm" :class="textColor">pie_chart</span>
          <span class="font-bold">{{ store.selectedStat?.progressPercent || 0 }}%</span>
        </div>
      </div>
      <div class="flex flex-col items-center justify-center">
        <div class="flex flex-row space-x-1 items-center">
          <span class="material-icons text-sm" :class="textColor">whatshot</span>
          <span class="font-bold">{{ streak }}d</span>
        </div>
      </div>
      <div class="flex flex-col items-center justify-center">
        <div class="flex flex-row space-x-1 items-center">
          <span class="material-icons text-sm" :class="textColor">grade</span>
          <span class="font-bold">{{ getGrade(store.selectedStat?.progressPercent || 0) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import RadialProgressbar from './RadialProgressbar.vue';
import { useStatStore } from '../store/statStore.js';
import { useUserStore } from '../store/userStore.js';
import { habitService } from '../services/habitService';

const store = useStatStore();
const userStore = useUserStore();

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const calendarDays = ref([]);
const streak = ref(0);
const loading = ref(true);

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const currentMonthName = computed(() => monthNames[store.month]);
const textColor = computed(() => `text-${store.selectedStat?.color?.default || 'violet-400'}`);
const fillColor = computed(() => `text-${store.selectedStat?.color?.default || 'violet-400'}`);
const fillClass = computed(() => `fill-current ${textColor.value}`);

const getGrade = (p) => {
  if (p >= 90) return 'S';
  if (p >= 80) return 'A';
  if (p >= 60) return 'B';
  if (p >= 40) return 'C';
  if (p >= 20) return 'D';
  return 'F';
};

const refreshData = async () => {
  if (!store.selectedStat) return;
  loading.value = true;
  
  const start = new Date(store.year, store.month, 1);
  const end = new Date(store.year, store.month + 1, 0);
  
  // Use the new local service
  const dailyMap = await habitService.fetchHabitMetrics(userStore.getUserId, start, end);
  
  buildCalendar(dailyMap);
  calculateStreak(dailyMap);
  loading.value = false;
};

const buildCalendar = (dailyMap) => {
  const firstDay = new Date(store.year, store.month, 1).getDay();
  const daysInMonth = new Date(store.year, store.month + 1, 0).getDate();
  const prevMonthDays = new Date(store.year, store.month, 0).getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  let days = [];

  // Previous Month Padding
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, isCurrentMonth: false });
  }

  // Current Month
  for (let i = 1; i <= daysInMonth; i++) {
    const dateKey = `${store.year}-${String(store.month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const metrics = dailyMap[dateKey]?.find(h => h.id === store.selectedStat.id);
    
    // Streak/Progress only counts if it's NOT a future date
    const isFuture = new Date(store.year, store.month, i) > today;

    days.push({
      day: i,
      isCurrentMonth: true,
      isToday: dateKey === todayStr,
      isScheduled: metrics?.isScheduled && !isFuture,
      isPaused: metrics?.isPausedOnDay || false,
      progress: metrics ? (metrics.actualProgress / metrics.dailyGoal) * 100 : 0
    });
  }

  // Next Month Padding
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, isCurrentMonth: false });
  }

  calendarDays.value = days;
};

const calculateStreak = (dailyMap) => {
  let count = 0;
  // Sort keys descending to check from most recent day backwards
  const days = Object.keys(dailyMap).sort().reverse();
  
  for (const dateKey of days) {
    const metrics = dailyMap[dateKey]?.find(h => h.id === store.selectedStat.id);
    if (!metrics || !metrics.isScheduled) continue;
    
    if (metrics.actualProgress >= metrics.dailyGoal) {
      count++;
    } else if (!metrics.isPausedOnDay) {
      // Habit missed and not paused = streak broken
      break;
    }
  }
  streak.value = count;
};

onMounted(refreshData);

// Automatically refresh if the user changes the month in the parent view
watch(() => store.viewDate, refreshData);
</script>