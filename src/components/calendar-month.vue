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
import { mapState } from 'vuex';
import RadialProgressbar from './RadialProgressbar.vue';
import { getTotalProgressDayForMonth } from '../utils/getTotalProgressDayForMonth';
import { db } from '../db'; // Dexie IndexedDB
import { toMillis } from '../utils/timestampUtils';

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
    ...mapState(['habits', 'weekProgress', 'pauses']), // <-- Add pauses to mapState
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
      progressArray: [], // Combined progress data
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
      this.fetchProgress();
    },
    nextMonth() {
      if (this.currentMonth === 11) {
        this.currentMonth = 0;
        this.currentYear++;
      } else {
        this.currentMonth++;
      }
      this.setupMonthDays();
      this.fetchProgress();
    },
    async fetchProgress() {
      const firstDayOfCurrentMonth = new Date(this.currentYear, this.currentMonth, 1);
      const lastDayOfCurrentMonth = new Date(this.currentYear, this.currentMonth + 1, 0);
      firstDayOfCurrentMonth.setHours(0, 0, 0, 0);
      lastDayOfCurrentMonth.setHours(23, 59, 59, 999);
      
      const startOfMonthMs = firstDayOfCurrentMonth.getTime();
      const endOfMonthMs = lastDayOfCurrentMonth.getTime();

      // Get habit IDs
      const habitIds = this.habits.map(habit => habit.habitId);

      try {
        // Query Dexie for progress documents
        const progressDocs = await db.progress
          .where('habitId')
          .anyOf(habitIds)
          .toArray();

        // Filter by timestamp range and convert to Firestore-like format
        const progressArray = progressDocs
          .filter(doc => doc.timestamp >= startOfMonthMs && doc.timestamp <= endOfMonthMs)
          .map(doc => ({
            ...doc,
            progressId: doc.id,
            timestamp: { seconds: Math.floor(doc.timestamp / 1000), nanoseconds: 0 }
          }));

        this.processProgressData(progressArray);
      } catch (error) {
        console.error('Error fetching progress from Dexie:', error);
      }
    },
    processProgressData(progressArray) {
      const outputArray = progressArray.reduce((acc, curr) => {
        const currentDateMs = toMillis(curr.timestamp) || 0;
        const currentDate = new Date(currentDateMs);
        const currentDay = currentDate.setHours(0, 0, 0, 0);

        const existingHabit = acc.find(habit => {
          const habitDateMs = toMillis(habit.timestamp) || 0;
          const habitDate = new Date(habitDateMs);
          const existingDay = habitDate.setHours(0, 0, 0, 0);
          return habit.habitId === curr.habitId && existingDay === currentDay;
        });

        if (existingHabit) {
          if (curr.progress > existingHabit.progress) {
            acc[acc.indexOf(existingHabit)] = curr;
          }
        } else {
          acc.push(curr);
        }
        return acc;
      }, []);

      this.progressArray = outputArray;
      // Update the existing calendar days with progress data
      this.updateProgressValues();
    },
    updateProgressValues() {
      this.calendarDays = this.calendarDays.map(day => {
        if (day.isCurrentMonth) {
          const dayDate = new Date(this.currentYear, this.currentMonth, day.day);
          // Pass pauses from Vuex state
          const { totalProgress } = getTotalProgressDayForMonth(dayDate, this.progressArray, this.habits, this.pauses);
          return { ...day, progress: totalProgress };
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
      console.log(day)
      const selectedDate = new Date(this.currentYear, this.currentMonth, day.day);
      const today = new Date();
      const currentDayOfWeek = today.getDay();
      const currentDate = today.getDate();

      // Calculate start of this week and last week
      const startOfThisWeek = new Date(today);
      startOfThisWeek.setDate(currentDate - currentDayOfWeek);
      startOfThisWeek.setHours(0, 0, 0, 0);

      const startOfLastWeek = new Date(startOfThisWeek);
      startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

      const endOfLastWeek = new Date(startOfThisWeek);
      endOfLastWeek.setHours(0, 0, 0, 0);

      // Check if selected date is within this week or last week
      if (selectedDate >= startOfThisWeek) {
        // Date is in this week
        if (!this.$store.state.weekProgress.some(progress => {
          const progressDateMs = toMillis(progress.timestamp) || 0;
          const progressDate = new Date(progressDateMs);
          return progressDate >= startOfThisWeek;
        })) {
          // This week's data not fetched yet, fetch it
          this.$store.dispatch('fetchWeekProgress', 'thisWeek');
        }
        this.$router.push({
          name: 'calendar-p2',
          params: {
            date: selectedDate.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' })
          }
        });
      } else if (selectedDate >= startOfLastWeek && selectedDate < endOfLastWeek) {
        // Date is in last week
        if (!this.$store.state.weekProgress.some(progress => {
          const progressDateMs = toMillis(progress.timestamp) || 0;
          const progressDate = new Date(progressDateMs);
          return progressDate >= startOfLastWeek && progressDate < endOfLastWeek;
        })) {
          // Last week's data not fetched yet, fetch it
          this.$store.dispatch('fetchWeekProgress', 'lastWeek');
        }
        this.$router.push({
          name: 'calendar-p2',
          params: {
            date: selectedDate.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' })
          }
        });
      } else {
        // Date is outside this week and last week, fetch normally
        this.$router.push({
          name: 'calendar-p2',
          params: {
            date: selectedDate.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' })
          }
        });
      }
    },
  },
  mounted() {
    // Calculate initial calendar days without progress
    this.setupMonthDays();
    // Then fetch progress data
    this.fetchProgress();
  },
};
</script>

<style scoped>
.relative {
  position: relative;
}
</style>
