<template>
  <div class="w-full flex items-center">
    <!-- Left Chevron (previous week) -->
    <button 
      class="text-gray-500 hover:text-gray-700 material-icons mr-1" 
      :class="{ 'invisible': currentWeek === 'lastWeek' }" 
      @click="showLastWeek"
    >
      chevron_left
    </button>

    <!-- Days display -->
    <div class="flex flex-row gap-0.5 flex-grow">
      <div
        v-for="day in days"
        :key="day.date"
        :class="['flex-auto', 'cursor-pointer']"
        @click="day.dateobj <= new Date().setHours(23, 59, 59, 999) ? selectDay(day) : null"
      >
        <div 
          :class="[ 
            'rounded-full p-1 pb-2', 
            this.selectedDay?.getDate() === day.dateobj.getDate() ? 'border-violet-400 bg-violet-400' : 'border-slate-200 bg-white',
            day.dateobj <= new Date().setHours(23, 59, 59, 999) ? 'cursor-pointer hover:border-violet-400' : 'cursor-default border-gray-50 bg-gray-50',
          ]"
        >
          <div class="flex flex-col items-center">
            <span class="min-w-8 text-center font-semibold text-xs sm:text-sm"
            :class="[this.selectedDay?.getDate() === day.dateobj.getDate() ? 'text-white' : '', day.dateobj < new Date().setHours(23, 59, 59, 999) ? 'text-black' : 'text-gray-400']">{{ day.name }}</span>
            <RadialProgressbar
              :show="day.dateobj <= new Date().setHours(23, 59, 59, 999)"
              :progress="habitsProgress(day.dateobj)"
              :radius="40"
              :text="String(day.date)"
              :strokeWidth="5"
              :textcolor="this.selectedDay?.getDate() === day.dateobj.getDate() ? '#ffffff' : '#000000'"
              :bgcolor="this.selectedDay?.getDate() === day.dateobj.getDate() ? 'text-white opacity-25' : 'text-black opacity-10'"
              class="pt-2"
              :color="this.selectedDay?.getDate() === day.dateobj.getDate() ? 'text-white' : 'text-violet-400'"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Right Chevron (next week) -->
    <button 
      class="text-gray-500 hover:text-gray-700 material-icons ml-1" 
      :class="{ 'invisible': currentWeek === 'thisWeek' }" 
      @click="showThisWeek"
    >
      chevron_right
    </button>
  </div>
</template>


<script>
import RadialProgressbar from './RadialProgressbar.vue';
import { mapActions, mapState } from 'vuex';
import { getTotalProgressDay } from '../utils/getTotalProgressDay';

export default {
  components: {
    RadialProgressbar,
  },
  data() {
    return {
      currentWeek: 'thisWeek', // Tracks the currently viewed week
      days: this.generateWeekDays('thisWeek'), // Initially show this week's days
    };
  },
  mounted() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    if (this.selectedDay.getDate() < startOfWeek.getDate()) {
        this.currentWeek = 'lastWeek';
        this.days = this.generateWeekDays('lastWeek');
      } else {
        this.currentWeek = 'thisWeek';
        this.days = this.generateWeekDays('thisWeek');
      }
  },
  computed: {
    ...mapState(['habits', 'weekHabits', 'dayHabits', 'weekProgress', 'selectedDay']),
  },
  methods: {
    ...mapActions(['updateSelectedDay']),
    
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
      this.updateSelectedDay(selectedDate);
      this.$store.dispatch('getDayHabits', selectedDate, true);
      this.$store.dispatch('getDayMemos', selectedDate)
      this.$router.push('/');
    },

    habitsProgress(day) {
      const { totalProgress } = getTotalProgressDay(day, this.weekProgress, this.habits);
      return totalProgress;
    },

    showLastWeek() {
      this.currentWeek = 'lastWeek';
      this.days = this.generateWeekDays('lastWeek'); // Generate days for last week
      // Set the selected day to Saturday
      const today = new Date();
      const currentDayOfWeek = today.getDay();
      const lastSat = new Date(today);
      lastSat.setDate(today.getDate() - currentDayOfWeek - 1);
      const lastSaturday = this.days.find(day => day.date === lastSat.getDate());
      if (lastSaturday) {
        this.selectDay(lastSaturday);
      }
    },
    showThisWeek() {
      this.currentWeek = 'thisWeek';
      this.days = this.generateWeekDays('thisWeek'); // Generate days for this week
      // Set the selected day to today
      const today = this.days.find(day => day.isToday);
      if (today) {
        this.selectDay(today);
      }
    },
  },
};
</script>
