<template>
  <div class="flex flex-col bg-white rounded-lg p-4 text-center">
    <!-- Calendar Header -->
    <div class="flex justify-between items-center mb-4">
      <button class="text-gray-500 hover:text-gray-700 material-icons" @click="previousMonth">chevron_left</button>
      <span class="font-semibold text-lg">{{ currentMonthName }} {{ currentYear }}</span>
      <button class="text-gray-500 hover:text-gray-700 material-icons" @click="nextMonth">chevron_right</button>
    </div>

    <!-- Days of the Week -->
    <div class="w-full grid grid-cols-7 text-gray-600 mb-2 gap-x-1">
      <div v-for="day in daysOfWeek" :key="day" class="flex-1">{{ day }}</div>
    </div>

    <!-- Calendar Days -->
    <div class="grid grid-cols-7 text-center gap-x-1">
      <!-- Render all days (previous, current, and next) -->
      <div
        v-for="(day, index) in calendarDays"
        :key="index"
        :class="[ 
          day.isToday ? 'text-purple-500' : '', 
          'relative', 'p-2', 'rounded-full', 
          'transition-colors duration-300' 
        ]"
      >
        
        <div class="min-h-10 flex flex-col items-center">
          <RadialProgressbar
          :show="day.isCurrentMonth && (day.day <= today || currentMonth < todayMonth || currentYear < todayYear)"
          :progress="day.randomProgress"
          :radius="40"
          :datenumber="day.day"
          :datecolor="day.isCurrentMonth? '#000000' : '#9ca3af'"
          :datesize="36"
          color="text-violet-400"/>
          <svg v-if="day.isToday" class="fill-violet-400 w-2 h-2 mt-1">
            <circle r="3" cx="3" cy="3" />
          </svg>
        </div> 
      </div>
    </div>

  </div>
</template>

<script>
import RadialProgressbar from './RadialProgressbar.vue';

export default {
  components: {
    RadialProgressbar,
  },
  data() {
    return {
      currentMonth: new Date().getMonth(), // 0-11, current month
      currentYear: new Date().getFullYear(),
      // selectedDay: 10, // Example for selected day
      // highlightedDays: [9, 10], // Example for highlighted days
      daysOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      today: new Date().getDate(), // Today's date
      todayMonth: new Date().getMonth(), // Today's month
      todayYear: new Date().getFullYear(), // Today's year
    };
  },
  computed: {
    // Get the name of the current month
    currentMonthName() {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October', 'November', 'December',
      ];
      return monthNames[this.currentMonth];
    },

    // Generate the days of the calendar
    calendarDays() {
      const days = [];
      const totalDaysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
      const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1).getDay();

      // Days from previous month to fill the first row
      const prevMonthDays = new Date(this.currentYear, this.currentMonth, 0).getDate();
      for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        days.push({
          day: prevMonthDays - i,
          isCurrentMonth: false,
          isToday: false,
          randomProgress: Math.floor(Math.random() * 100)
        });
      }

      // Current month days
      for (let i = 1; i <= totalDaysInMonth; i++) {
        days.push({
          day: i,
          isCurrentMonth: true,
          isSelected: i === this.selectedDay,
          //isHighlighted: this.highlightedDays.includes(i),
          isToday: i === this.today && this.currentMonth === this.todayMonth && this.currentYear === this.todayYear,
          randomProgress: Math.floor(Math.random() * 100)
        });
      }

      // Fill the last row with next month's days
      const remainingDays = (7 - (days.length % 7)) % 7;
      for (let i = 1; i <= remainingDays; i++) {
        days.push({
          day: i,
          isCurrentMonth: false,
          isToday: false,
          randomProgress: Math.floor(Math.random() * 100)
        });
      }

      return days;
    },
  },
  methods: {
    // Go to the previous month
    previousMonth() {
      if (this.currentMonth === 0) {
        this.currentMonth = 11;
        this.currentYear--;
      } else {
        this.currentMonth--;
      }
    },
    // Go to the next month
    nextMonth() {
      if (this.currentMonth === 11) {
        this.currentMonth = 0;
        this.currentYear++;
      } else {
        this.currentMonth++;
      }
    },
  },
};
</script>

<style scoped>
.relative {
  position: relative;
}
</style>
