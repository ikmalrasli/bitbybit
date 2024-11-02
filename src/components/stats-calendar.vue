<template>
  <div class="flex flex-col bg-white rounded-lg text-center space-y-2">
    <div class="border rounded-lg p-2">
      <!-- Calendar Header -->
      <div class="w-full flex text-center items-center mb-4">
        <span class="w-full font-semibold text-lg text-center">{{ currentMonthName }} {{ currentYear }}</span>
      </div>

      <!-- Days of the Week -->
      <div class="w-full grid grid-cols-7 text-black mb-2 gap-x-1">
        <div v-for="day in daysOfWeek" :key="day" class="flex-1">{{ day }}</div>
      </div>

      <!-- Calendar Days -->
      <div v-if="!loading" class="grid grid-cols-7 text-center gap-x-1">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          :class="[ 
            day.isToday ? 'text-purple-500' : '', 
            'relative', 'p-2', 'rounded-full', 
            'transition-colors duration-300' 
          ]"
        >
          <div class="flex flex-col items-center">
            <!-- Show RadialProgressBar for current month and days up to today -->
            <RadialProgressbar
              :show="day.isCurrentMonth && (day.day <= today || currentMonth < todayMonth || currentYear < todayYear)"
              :progress="day.progress"
              :radius="40"
              :text="String(day.day)"
              :textcolor="day.isCurrentMonth? '#000000' : '#9ca3af'"
              :textsize="36"
              :color="statStore.textColor"
            />
            <div class="h-1 w-1 md:h-2 md:w-2" :class="[{ 'invisible': !day.isToday }, fillClass]">
              <svg class="h-full w-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <!-- Default Calendar Days (Loading) -->
      <div v-else class="grid grid-cols-7 text-center gap-x-1">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          :class="[ 
            day.isToday ? 'text-purple-500' : '', 
            'relative', 'p-2', 'rounded-full', 
            'transition-colors duration-300' 
          ]"
        >
          <div class="flex flex-col items-center">
            <!-- Show RadialProgressBar for current month and days up to today -->
            <RadialProgressbar
              :show="false"
              :progress="day.progress"
              :radius="40"
              :text="String(day.day)"
              :textcolor="day.isCurrentMonth? '#000000' : '#9ca3af'"
              :textsize="36"
              :color="statStore.textColor"
            />
            <div class="h-1 w-1 md:h-2 md:w-2 invisible">
              <svg class="h-full w-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-4 p-4 w-full border rounded-lg">
      <div class="flex flex-col items-center justify-center">
        <div class="flex flex-row space-x-1">
          <span class="material-icons" :class="statStore.textColor">pie_chart</span>
          <span>{{ statStore.selectedStat.progressPercent }}%</span>
        </div>
      </div>
      <div class="flex flex-col items-center justify-center">
        <div class="flex flex-row space-x-1">
          <span class="material-icons" :class="statStore.textColor">local_fire_department</span>
          <span>{{ streak }}d</span>
        </div>
      </div>
      <div class="flex flex-col items-center justify-center">
        <div class="flex flex-row space-x-1">
          <span class="material-icons" :class="statStore.textColor">grade</span>
          <span>{{ getGrade(statStore.selectedStat.progressPercent) }}</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import RadialProgressbar from './RadialProgressbar.vue';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useStatStore } from '../store/statStore.js';

export default {
  components: {
    RadialProgressbar,
  },
  data() {
    const statStore = useStatStore();
    return {
      statStore,
      daysOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      today: new Date().getDate(),
      todayMonth: new Date().getMonth(),
      todayYear: new Date().getFullYear(),
      calendarDays: [],
      progressArray: [],
      streak: 0,
      dailyProgressData: {},
      loading: true,
    };
  },
  computed: {
    currentMonthName() {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ];
      return monthNames[this.statStore.selectedMonth];
    },
    fillClass() {
      return `${this.statStore.fillColor}`;
    },
    currentMonth() {
      return this.statStore.selectedMonth;
    },
    currentYear() {
      return this.statStore.selectedYear;
    },
    selectedStats() {
      return this.statStore.selectedStat;
    },
    dailyGoal() {
      return this.statStore.selectedStat.dailyGoal;
    }
  },
  methods: {
    getGrade(progress) {
      if (progress >= 80) return 'A';
      if (progress >= 60) return 'B';
      if (progress >= 40) return 'C';
      if (progress >= 20) return 'D';
      return 'F'; // For progress less than 20%
    },
    async fetchProgress() {
      const startOfMonth = new Date(this.currentYear, this.currentMonth, 1, 0, 0, 0, 0);
      const endOfMonth = new Date(this.currentYear, this.currentMonth + 1, 0, 23, 59, 59, 999);
      const habitId = this.statStore.selectedStat.habitId;
      const dailyGoal = this.statStore.selectedStat.dailyGoal;

      // Query all progress documents for this habit within the month
      const q = query(
        collection(db, "progress"),
        where("timestamp", ">=", startOfMonth),
        where("timestamp", "<=", endOfMonth),
        where("habitId", "==", habitId),
        orderBy("timestamp", "desc") // Order by timestamp to help with filtering the latest entries
      );

      // Fetch all documents in the range
      const querySnapshot = await getDocs(q);

      // Process documents to get the latest entry per day
      const dailyProgressMap = {};
      this.dailyProgressData = {}; // Reset daily progress data
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const progressDate = new Date(data.timestamp.toDate());
        //const dayKey = progressDate.toISOString().split("T")[0]; // Extract the day in YYYY-MM-DD format (cannot use this because of timezones, date is different)
        const dayKey = `${progressDate.getFullYear()}-${String(progressDate.getMonth() + 1).padStart(2, '0')}-${String(progressDate.getDate()).padStart(2, '0')}`;
        //console.log('date:'+progressDate, 'daykey:'+dayKey)

        // Only keep the latest document for each day
        if (!dailyProgressMap[dayKey]) {
          const progressPercent = Number((data.progress * 100 / dailyGoal).toFixed(0));
          dailyProgressMap[dayKey] = {progress: data.progress, timestamp: data.timestamp, progressPercent: progressPercent}; // Save the first (latest) document per day
          // console.log(dayKey,dailyProgressMap[dayKey])
        }
      });
      
      this.generateDaysWithProgress(dailyProgressMap);
      this.computeLongestStreak(dailyProgressMap);
    },
    generateDaysWithProgress(dailyProgressMap) {
      const totalDaysInMonth = new Date(this.statStore.selectedYear, this.statStore.selectedMonth + 1, 0).getDate();
      const firstDayOfMonth = new Date(this.statStore.selectedYear, this.statStore.selectedMonth, 1).getDay();
      const prevMonthDays = new Date(this.statStore.selectedYear, this.statStore.selectedMonth, 0).getDate();

      let days = [];

      // Add previous month's days
      for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        days.push({
          day: prevMonthDays - i,
          isCurrentMonth: false,
          isToday: false,
          progress: 0,
        });
      }

      // Add current month's days with progress
      for (let i = 1; i <= totalDaysInMonth; i++) {
        const dayDate = new Date(this.statStore.selectedYear, this.statStore.selectedMonth, i+1);
        const progressPercent = this.getProgressPercent(dayDate, dailyProgressMap);

        days.push({
          day: i,
          isCurrentMonth: true,
          isToday: i === this.today && this.statStore.selectedMonth === this.todayMonth && this.statStore.selectedYear === this.todayYear,
          progress: progressPercent,
        });

      }

      // Fill remaining days from the next month
      const remainingDays = (7 - (days.length % 7)) % 7;
      for (let i = 1; i <= remainingDays; i++) {
        days.push({
          day: i,
          isCurrentMonth: false,
          isToday: false,
          progress: 0,
        });
      }

      this.calendarDays = days;
      this.loading = false; // Set loading to false after fetching
    },
    getProgressPercent(dayDate, dailyProgressMap){
      const dayKey = dayDate.toISOString().split("T")[0];
      let dayProgress = 0;
      if (dailyProgressMap[dayKey]) {
        dayProgress = dailyProgressMap[dayKey].progress;
      }
      const progressPercent = (dayProgress / this.dailyGoal) * 100;
      return progressPercent
    },
    generateDefaultCalendarDays() {
      const totalDaysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
      const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1).getDay();
      const prevMonthDays = new Date(this.currentYear, this.currentMonth, 0).getDate();

      let days = [];

      // Add previous month's days
      for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        days.push({
          day: prevMonthDays - i,
          isCurrentMonth: false,
          isToday: false,
          progress: 0,
        });
      }

      // Add current month's days with progress
      for (let i = 1; i <= totalDaysInMonth; i++) {
        days.push({
          day: i,
          isCurrentMonth: true,
          isToday: i === this.today && this.currentMonth === this.todayMonth && this.currentYear === this.todayYear,
          progress: 0,
        });

      }

      // Fill remaining days from the next month
      const remainingDays = (7 - (days.length % 7)) % 7;
      for (let i = 1; i <= remainingDays; i++) {
        days.push({
          day: i,
          isCurrentMonth: false,
          isToday: false,
          progress: 0,
        });
      }

      this.calendarDays = days;
    },
    computeLongestStreak(dailyProgressMap) {
      let longestStreak = 0;
      let currentStreak = 0;
      let previousDate = null;

      // Sort keys to ensure sequential days
      const sortedDays = Object.keys(dailyProgressMap).sort();

      sortedDays.forEach(dayKey => {
        const progressData = dailyProgressMap[dayKey];
        const progressPercent = progressData.progressPercent;

        if (progressPercent === 100) {
          // Check if previous date was the day before the current one
          const currentDate = new Date(dayKey);
          if (previousDate && currentDate - previousDate === 86400000) {
            currentStreak++;  // Continue streak if days are consecutive
          } else {
            currentStreak = 1;  // Reset streak if not consecutive
          }
          longestStreak = Math.max(longestStreak, currentStreak);
          previousDate = currentDate;
        } else {
          currentStreak = 0;  // Reset streak if progress is not 100%
          previousDate = null;
        }
      });

      this.streak = longestStreak;  // Update the streak value
    },
  },
  watch: {
    selectedStats() {
      this.fetchProgress();
    }
  },
  mounted() {
    this.generateDefaultCalendarDays();
    this.fetchProgress();
  },
};
</script>

<style scoped>
.relative {
  position: relative;
}
</style>
