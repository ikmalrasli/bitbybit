<template>
  <div class="w-full flex flex-col flex-grow bg-gray-50">
    <header class="bg-white pt-1 pb-2 px-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
      <button class="material-icons p-2 active:bg-gray-100 rounded-full" @click="store.changeMonth(-1)">
        chevron_left
      </button>

      <h1 class="text-xl font-semibold">{{ monthName }} {{ store.year }}</h1>

      <button class="material-icons p-2 active:bg-gray-100 rounded-full disabled:text-gray-300"
        :disabled="isCurrentMonth" @click="store.changeMonth(1)">
        chevron_right
      </button>
    </header>

    <div class="flex-grow flex flex-col px-4 pt-4 overflow-hidden">
      <div class="w-full p-4 bg-white border rounded-xl flex items-center shadow-sm mb-2">
        <template v-if="!store.loading">
          <h2 class="w-3/4 text-md font-medium pr-4 leading-tight">{{ motivationText }}</h2>
          <div class="w-1/4">
            <RadialProgressbar :progress="overallProgress" :radius="45" :text="displayLabel" color="text-violet-500"
              @click="showGrade = !showGrade" />
          </div>
        </template>
        <div v-else class="animate-pulse flex w-full space-x-4">
          <div class="h-12 bg-gray-200 rounded flex-grow"></div>
          <div class="h-16 w-16 bg-gray-200 rounded-full"></div>
        </div>
      </div>

      <!-- More Options Button (Dropdown Toggle) -->
      <div class="relative flex flex-row items-center p-2">
        <span class="text-sm font-semibold uppercase tracking-widest">Summary</span>
        <hr class="flex-grow border-t border-gray-300 mx-4" />
        <div class="space-x-1 flex items-center cursor-pointer" @click="toggleDropdown">
          <span class="material-icons text-md rounded-full">sort</span>
          <span class="font-semibold text-sm uppercase tracking-widest">Sort</span>
        </div>
        <div v-if="isDropdownOpen"
          class="absolute right-0 z-50 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200"
          style="position: absolute; top: 100%;" @click.stop>
          <ul class="py-1 text-gray-700">
            <li @click="sortName"
              class="flex justify-between items-center px-4 py-2 text-md hover:bg-gray-100 cursor-pointer">
              <span>Name</span>
              <span v-if="currentSort === 'name'" class="material-icons">{{ sortNameAsc ? 'arrow_upward' :
                'arrow_downward'
                }}</span>
            </li>
            <li @click="sortProgress"
              class="flex justify-between items-center px-4 py-2 text-md hover:bg-gray-100 cursor-pointer">
              <span>Progress</span>
              <span v-if="currentSort === 'progress'" class="material-icons">{{ sortProgressAsc ? 'arrow_upward' :
                'arrow_downward' }}</span>
            </li>
            <li @click="sortColor"
              class="flex justify-between items-center px-4 py-2 text-md hover:bg-gray-100 cursor-pointer">
              <span>Color</span>
              <span v-if="currentSort === 'color'" class="material-icons">{{ sortColorAsc ? 'arrow_upward' :
                'arrow_downward'
                }}</span>
            </li>
          </ul>
        </div>
      </div>


      <div class="flex-grow overflow-y-auto pb-6 custom-scrollbar">
        <div v-if="habits.length > 0" class="space-y-3">
          <div v-for="habit in habits" :key="habit.id" @click="openDetail(habit)"
            class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between active:bg-gray-50 transition-colors">
            <div class="flex items-center space-x-3">
              <div :class="`h-3 w-3 rounded-full bg-${habit.color?.default || 'violet-400'}`"></div>
              <span class="font-medium text-gray-700">{{ habit.name }}</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-lg font-semibold text-gray-600">{{ habit.progressPercent }}%</span>
              <span class="material-icons text-gray-300">chevron_right</span>
            </div>
          </div>
        </div>

        <div v-else-if="!store.loading" class="text-center mt-20 text-gray-400">
          <p>No activity tracked for this month.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useStatStore } from '../../store/statStore';
import { useRouter } from 'vue-router';
import RadialProgressbar from '../../components/RadialProgressbar.vue';
import { habitService } from '../../services/habitService';
import { useUserStore } from '../../store/userStore';

const store = useStatStore();
const router = useRouter();
const userStore = useUserStore();
const showGrade = ref(true);

// Dropdown state
const isDropdownOpen = ref(false);
const currentSort = ref('');
const sortNameAsc = ref(true);
const sortProgressAsc = ref(true);
const sortColorAsc = ref(true);

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Helper functions for proper progress calculation (same as stats-calendar.vue)
const isDateInTermRange = (date, habit) => {
  if (!habit) return false;
  
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  const termStart = habit.termStart ? new Date(habit.termStart) : null;
  const termEnd = habit.termEnd ? new Date(habit.termEnd) : null;
  
  if (termStart) {
    termStart.setHours(0, 0, 0, 0);
    if (checkDate < termStart) return false;
  }
  
  if (termEnd) {
    termEnd.setHours(23, 59, 59, 999);
    if (checkDate > termEnd) return false;
  }
  
  return true;
};

const getEligibleDayCount = (habit, year, month) => {
  if (!habit) return 0;
  
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  
  let startDate = new Date(year, month, 1);
  let endDate = new Date(year, month + 1, 0); // Last day of month
  
  // Apply termStart logic
  if (habit.termStart) {
    const termStart = new Date(habit.termStart);
    termStart.setHours(0, 0, 0, 0);
    
    if (termStart.getFullYear() === year && termStart.getMonth() === month) {
      // termStart is within this month
      if (termStart.getDate() > 1) {
        startDate = termStart;
      }
    }
    // If termStart is before this month, keep startDate as 1st of month
  }
  
  // Apply termEnd logic
  if (habit.termEnd) {
    const termEnd = new Date(habit.termEnd);
    termEnd.setHours(23, 59, 59, 999);
    
    if (termEnd.getFullYear() === year && termEnd.getMonth() === month) {
      // termEnd is within this month
      if (termEnd < endDate) {
        endDate = termEnd;
      }
    }
    // If termEnd is after this month, keep endDate as end of month
  } else if (isCurrentMonth) {
    // termEnd is null and this is current month - count till today
    endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    endDate.setHours(23, 59, 59, 999);
  }
  
  // Ensure we don't count future days in current month
  if (isCurrentMonth && endDate > today) {
    endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    endDate.setHours(23, 59, 59, 999);
  }
  
  // Count days, but only if they're scheduled days
  let eligibleCount = 0;
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayName = days[d.getDay()];
    if (habit.repeat?.[dayName]) {
      eligibleCount++;
    }
  }
  
  return eligibleCount;
};

const calculateMonthlyProgress = async (habit, year, month) => {
  if (!habit) return 0;
  
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  
  // Get the daily data for this habit
  const dailyMap = await habitService.fetchHabitMetrics(userStore.getUserId, start, end);
  
  let totalActualProgress = 0;
  const eligibleDays = getEligibleDayCount(habit, year, month);
  
  if (eligibleDays === 0) return 0;
  
  // Sum actual progress for all eligible days
  Object.keys(dailyMap).forEach(dateKey => {
    const date = new Date(dateKey);
    if (date.getFullYear() === year && date.getMonth() === month) {
      if (isDateInTermRange(date, habit)) {
        const metrics = dailyMap[dateKey]?.find(h => h.id === habit.id);
        if (metrics && metrics.isScheduled) {
          totalActualProgress += metrics.actualProgress || 0;
        }
      }
    }
  });
  
  const totalGoal = habit.dailyGoal * eligibleDays;
  return totalGoal > 0 ? Math.min(100, Math.round((totalActualProgress / totalGoal) * 100)) : 0;
};

// Computed
const rawHabits = computed(() => store.currentMonthHabits);

// Computed property with corrected progress calculations
const habitsWithCorrectProgress = computed(() => {
  return rawHabits.value.map(habit => ({
    ...habit,
    calculatedProgressPercent: habit.progressPercent // Will be updated asynchronously
  }));
});

// Reactive reference to store calculated progress values
const calculatedProgressMap = ref({});

// Function to calculate progress for all habits
const calculateAllProgress = async () => {
  const progressMap = {};
  
  for (const habit of rawHabits.value) {
    const progress = await calculateMonthlyProgress(habit, store.year, store.month);
    progressMap[habit.id] = progress;
  }
  
  calculatedProgressMap.value = progressMap;
};

const habits = computed(() => {
  let sorted = habitsWithCorrectProgress.value.map(habit => ({
    ...habit,
    progressPercent: calculatedProgressMap.value[habit.id] || habit.progressPercent
  }));
  
  if (currentSort.value === 'name') {
    sorted.sort((a, b) => sortNameAsc.value ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
  } else if (currentSort.value === 'progress') {
    sorted.sort((a, b) => sortProgressAsc.value ? a.progressPercent - b.progressPercent : b.progressPercent - a.progressPercent);
  } else if (currentSort.value === 'color') {
    sorted.sort((a, b) => {
      const colorA = colorOrder[a.color?.default || "violet-400"] ?? 99;
      const colorB = colorOrder[b.color?.default || "violet-400"] ?? 99;
      return sortColorAsc.value ? colorA - colorB : colorB - colorA;
    });
  }
  
  return sorted;
});
const monthName = computed(() => monthNames[store.month]);

// Color order for sorting
const colorOrder = {
  "red-300": 0,
  "orange-300": 1,
  "yellow-300": 2,
  "emerald-300": 3,
  "blue-300": 4,
  "pink-300": 5,
  "violet-400": 6
};

// Disable "Next" button if we are looking at the current month/year
const isCurrentMonth = computed(() => {
  const now = new Date();
  return store.month === now.getMonth() && store.year === now.getFullYear();
});

const overallProgress = computed(() => {
  if (!habits.value.length) return 0;
  const total = habits.value.reduce((acc, h) => acc + (h.progressPercent || 0), 0);
  return Math.round(total / habits.value.length);
});

const displayLabel = computed(() => {
  if (!showGrade.value) return `${overallProgress.value}%`;
  const p = overallProgress.value;
  if (p >= 90) return 'S';
  if (p >= 80) return 'A';
  if (p >= 60) return 'B';
  if (p >= 40) return 'C';
  if (p >= 20) return 'D';
  return 'F';
});

const motivationText = computed(() => {
  const p = overallProgress.value;
  if (isCurrentMonth) {
    if (p >= 90) return "Outstanding! You're on fire this month!";
    if (p >= 80) return "Fantastic Effort so far! Keep up the great work today!";
    if (p >= 60) return "You're doing well! A little more effort could push you over the top.";
    if (p >= 50) return "Keep going! There's still time to reach your goal this month.";
    if (p >= 40) return "Progress is coming along—stay consistent, and results will follow!";
    if (p >= 20) return "Every small step counts. Let's make a push to improve this month!";
    return "Every day is a fresh start to build your streak.";
  } else {
    if (p >= 90) return "Perfect month! You crushed it this month.";
    if (p >= 80) return "Outstanding! You completed this month's goals with flying colors!";
    if (p >= 60) return "Great job! You made solid progress and met most of your goals.";
    if (p >= 50) return "Good effort! Though there was room for improvement, every bit counts.";
    if (p >= 40) return "Some progress made, though there were more opportunities to grow.";
    if (p >= 20) return "A fresh start awaits! Use last month's results as motivation to improve.";
    return "Every day is a fresh start to build your streak.";
  }
});

// Methods
const openDetail = (habit) => {
  store.selectedStat = habit;
  router.push({ name: 'detail-stats', params: { habitId: habit.id } });
};

// Dropdown and Sorting Functions
const toggleDropdown = (event) => {
  event.stopPropagation();
  isDropdownOpen.value = !isDropdownOpen.value;

  if (isDropdownOpen.value) {
    document.addEventListener('click', handleClickOutside);
  } else {
    document.removeEventListener('click', handleClickOutside);
  }
};

const handleClickOutside = (event) => {
  const dropdown = document.querySelector('.absolute');
  if (dropdown && !dropdown.contains(event.target)) {
    isDropdownOpen.value = false;
    document.removeEventListener('click', handleClickOutside);
  }
};

const sortName = () => {
  sortNameAsc.value = !sortNameAsc.value;
  currentSort.value = 'name';
  isDropdownOpen.value = false;
  document.removeEventListener('click', handleClickOutside);
};

const sortProgress = () => {
  sortProgressAsc.value = !sortProgressAsc.value;
  currentSort.value = 'progress';
  isDropdownOpen.value = false;
  document.removeEventListener('click', handleClickOutside);
};

const sortColor = () => {
  sortColorAsc.value = !sortColorAsc.value;
  currentSort.value = 'color';
  isDropdownOpen.value = false;
  document.removeEventListener('click', handleClickOutside);
};
onMounted(() => {
  store.loadStats().then(() => {
    calculateAllProgress();
  });
});

// Watch for month changes to recalculate progress
const unwatch = store.$onAction(({ name, after }) => {
  if (name === 'changeMonth') {
    after(() => {
      calculateAllProgress();
    });
  }
});
</script>