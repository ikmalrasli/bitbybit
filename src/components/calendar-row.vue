<template>
  <div class="w-full flex items-center">
    <!-- Left Chevron (previous week) -->
    <button class="text-gray-500 hover:text-gray-700 material-icons mr-1"
      :class="{ 'invisible': currentWeek === 'lastWeek' }" @click="showLastWeek">
      chevron_left
    </button>

    <!-- Days display -->
    <div class="flex flex-row flex-grow">
      <div v-for="day in days" :key="day.date" :class="['flex-auto', 'cursor-pointer']"
        @click="day.dateobj <= new Date().setHours(23, 59, 59, 999) ? selectDay(day) : null">
        <div :class="[
          'rounded-full p-1 pb-2',
          this.selectedDay?.getDate() === day.dateobj.getDate() ? 'border-violet-400 bg-violet-400' : 'border-slate-200 bg-white',
          day.dateobj <= new Date().setHours(23, 59, 59, 999) ? 'cursor-pointer hover:border-violet-400' : 'cursor-default border-gray-50 bg-gray-50',
        ]">
          <div class="flex flex-col items-center">
            <span class="min-w-8 text-center font-semibold text-xs sm:text-sm"
              :class="[this.selectedDay?.getDate() === day.dateobj.getDate() ? 'text-white' : '', day.dateobj < new Date().setHours(23, 59, 59, 999) ? 'text-black' : 'text-gray-400']">{{
                day.name }}</span>
            <RadialProgressbar :show="day.dateobj <= new Date().setHours(23, 59, 59, 999)"
              :progress="dayProgress(day.dateobj)" :radius="40" :text="String(day.date)" :strokeWidth="5"
              :textcolor="this.selectedDay?.getDate() === day.dateobj.getDate() ? '#ffffff' : '#000000'"
              :bgcolor="this.selectedDay?.getDate() === day.dateobj.getDate() ? 'text-white opacity-25' : 'text-black opacity-10'"
              class="pt-2"
              :color="this.selectedDay?.getDate() === day.dateobj.getDate() ? 'text-white' : 'text-violet-400'" />
          </div>
        </div>
      </div>
    </div>

    <!-- Right Chevron (next week) -->
    <button class="text-gray-500 hover:text-gray-700 material-icons ml-1"
      :class="{ 'invisible': currentWeek === 'thisWeek' }" @click="showThisWeek(true)">
      chevron_right
    </button>
  </div>
</template>


<script>
import RadialProgressbar from './RadialProgressbar.vue';
import { useUIStore } from '../store/uiStore';
import { useHabitStore } from '../store/habitStore';

export default {
  components: {
    RadialProgressbar,
  },
  data() {
    return {
      currentWeek: 'thisWeek', // Tracks the currently viewed week
      days: this.generateWeekDays('thisWeek'), // Initially show this week's days
      habitStore: useHabitStore(),
      uiStore: useUIStore(),
    };
  },
  mounted() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    if (this.selectedDay < startOfWeek) {
      this.currentWeek = 'lastWeek';
      this.days = this.generateWeekDays('lastWeek');
      this.$store.dispatch('showLastWeek');
    } else if (this.selectedDay >= startOfWeek) {
      this.showThisWeek(false);
    }
  },
  computed: {
    habitMetrics() {
      return this.habitStore.dayHabitMetrics;
    },

    selectedDay() {
      return this.uiStore.selectedDate;
    }

  },
  methods: {
    // TODO: create a dynamic way to generate week days (user can keep scrolling back to previous weeks)
    generateWeekDays(week) {
      const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      const today = new Date();
      const currentDayOfWeek = today.getDay();

      let startOfWeek;

      if (week === 'thisWeek') {
        startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - currentDayOfWeek);
      } else if (week === 'lastWeek') {
        startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - currentDayOfWeek - 7); // Adjust for last week
      }

      return Array.from({ length: 7 }).map((_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);

        return {
          name: daysOfWeek[day.getDay()],
          date: day.getDate(),
          isToday: day.toDateString() === today.toDateString(),
          month: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(day),
          dateobj: new Date(day),  // Store the Date object for comparison
        };
      });
    },

    selectDay(day) {
      const selectedDate = new Date(day.dateobj);
      this.uiStore.setSelectedDate(selectedDate);
      this.$router.push('/');
    },

    dayProgress(day) {
      const dateKey = day.toISOString().split('T')[0];
      const habitMetrics = this.habitMetrics[dateKey];

      // Return 0 if no metrics available yet (loading state)
      if (!habitMetrics || !Array.isArray(habitMetrics)) {
        return 0;
      }

      // Filter for habits that are scheduled and not paused
      const activeHabits = habitMetrics.filter(habit => {
        return habit.isScheduled && !habit.isPausedOnDay;
      });

      // Calculate total progress
      let progress = 0;
      let totalDailyGoal = 0;

      activeHabits.forEach(habit => {
        progress += Number(habit.actualProgress || 0);
        totalDailyGoal += habit.dailyGoal || 0;
      });


      return totalDailyGoal > 0 ? (progress / totalDailyGoal) * 100 : 0;
    },

    showLastWeek() {
      this.currentWeek = 'lastWeek';
      this.days = this.generateWeekDays('lastWeek');

      const today = new Date();
      const currentDayOfWeek = today.getDay();
      const lastSun = new Date(today);
      lastSun.setDate(today.getDate() - currentDayOfWeek - 7);
      const lastSunday = this.days.find(day => day.date === lastSun.getDate());

      // Set the selected day to Sunday of last week
      if (lastSunday) {
        this.selectDay(lastSunday);
      }
    },

    showThisWeek(showToday) {
      this.currentWeek = 'thisWeek';
      this.days = this.generateWeekDays('thisWeek');
      // Fetch this week's data
      if (showToday) {
        // Set the selected day to today
        const today = this.days.find(day => day.isToday);
        if (today) {
          this.selectDay(today);
        }
      }
    },
  },
};
</script>
