<template>
  <div class="flex flex-col bg-white rounded-lg p-4 text-center" @click="console.log()">
    <!-- Calendar Header -->
    <div class="flex justify-between items-center mb-4">
      <button class="text-gray-500 hover:text-gray-700 material-icons" @click="previousMonth">chevron_left</button>
      <span class="font-semibold text-lg">{{ currentMonthName }} {{ currentYear }}</span>
      <button class="text-gray-500 hover:text-gray-700 material-icons disabled:opacity-50" @click="nextMonth"
        :disabled="currentMonth === todayMonth && currentYear === todayYear">chevron_right</button>
    </div>

    <!-- Days of the Week -->
    <div class="w-full grid grid-cols-7 text-black mb-2 gap-x-1">
      <div v-for="day in daysOfWeek" :key="day" class="flex-1">{{ day }}</div>
    </div>

    <!-- Calendar Days -->
    <div class="grid grid-cols-7 text-center gap-1">
      <div v-for="(day, index) in calendarDays" :key="index" :class="[
        day.isToday ? 'text-purple-500' : '',
        'relative rounded-lg',
        'transition-colors duration-300',
        showBorder(day) ? 'cursor-pointer hover:bg-gray-50' : ''
      ]" @click="day.isCurrentMonth && viewDayDetails(day)">


        <div class="flex flex-col items-center p-1 rounded-lg" :class="{ 'border': showBorder(day) }">
          <!-- Show RadialProgressBar for current month and days up to today -->
          <RadialProgressbar
            :show="day.isCurrentMonth && (day.day <= today || currentMonth < todayMonth || currentYear < todayYear)"
            :progress="day.progress" :radius="40" :text="String(day.day)"
            :textcolor="day.isCurrentMonth ? '#000000' : '#9ca3af'" :textsize="36" :strokeWidth="5"
            color="text-violet-400" />
          <div class="fill-violet-400 h-1 w-1 md:h-2 md:w-2" :class="{ 'invisible': !day.isToday }">
            <svg class="h-full w-full" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import RadialProgressbar from './RadialProgressbar.vue';
import { useHabitStore } from '../store/habitStore';
import { useUIStore } from '../store/uiStore';
import { getLocalDateKey } from '../utils/dateHelpers';

export default {
  components: {
    RadialProgressbar,
  },
  computed: {
    currentMonthName() {
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
        'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      return monthNames[this.currentMonth];
    },
  },
  data() {
    return {
      currentMonth: new Date().getMonth(),
      currentYear: new Date().getFullYear(),
      daysOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      today: new Date().getDate(),
      todayMonth: new Date().getMonth(),
      todayYear: new Date().getFullYear(),
      calendarDays: [],
      habitStore: useHabitStore(),
      uiStore: useUIStore(),
    };
  },
  methods: {
    showBorder(day) {
      return ((this.currentYear < this.todayYear) ||
        (this.currentYear === this.todayYear && this.currentMonth < this.todayMonth) ||
        (this.currentYear === this.todayYear && this.currentMonth === this.todayMonth && day.day <= this.today)) &&
        day.isCurrentMonth
    },
    previousMonth() {
      if (this.currentMonth === 0) {
        this.currentMonth = 11;
        this.currentYear--;
      } else {
        this.currentMonth--;
      }
      this.setupMonthDays();
      this.fetchMonthProgress();
    },
    nextMonth() {
      if (this.currentMonth === 11) {
        this.currentMonth = 0;
        this.currentYear++;
      } else {
        this.currentMonth++;
      }
      this.setupMonthDays();
      this.fetchMonthProgress();
    },
    async fetchMonthProgress() {
      const firstDayOfCurrentMonth = new Date(this.currentYear, this.currentMonth, 1);
      const lastDayOfCurrentMonth = new Date(this.currentYear, this.currentMonth + 1, 0);
      firstDayOfCurrentMonth.setHours(0, 0, 0, 0);
      lastDayOfCurrentMonth.setHours(23, 59, 59, 999);

      // Use existing getHabitMetrics function from habitStore
      await this.habitStore.getHabitMetrics(firstDayOfCurrentMonth, lastDayOfCurrentMonth);
      this.updateProgressValues();
    },
    updateProgressValues() {
      this.calendarDays = this.calendarDays.map(day => {
        if (day.isCurrentMonth) {
          const dayDate = new Date(this.currentYear, this.currentMonth, day.day);
          const dateKey = getLocalDateKey(dayDate);
          const dayHabits = this.habitStore.dayHabitMetrics[dateKey] || [];
          
          // Calculate progress percentage for the day
          let totalProgress = 0;
          let totalGoal = 0;
          
          dayHabits.forEach(habit => {
            if (habit.isScheduled && !habit.isPausedOnDay) {
              totalGoal += habit.dailyGoal || 0;
              totalProgress += habit.actualProgress || 0;
            }
          });
          
          const progressPercent = totalGoal > 0 ? (totalProgress / totalGoal) * 100 : 0;
          return { ...day, progress: progressPercent };
        }
        return day;
      });
    },
    setupMonthDays() {
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

      // Add current month's days (initially without progress)
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
    viewDayDetails(day) {
      const selectedDate = new Date(this.currentYear, this.currentMonth, day.day);
      
      // Set the selected date in UI store
      this.uiStore.selectedDate = selectedDate;
      
      // Navigate to calendar-p2 with the selected date
      this.$router.push({
        name: 'calendar-p2',
        params: {
          date: selectedDate.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' })
        }
      });
    },
  },
  async mounted() {
    // Calculate initial calendar days without progress
    this.setupMonthDays();
    // Then fetch progress data
    await this.fetchMonthProgress();
  },
};
</script>

<style scoped>
.relative {
  position: relative;
}
</style>
