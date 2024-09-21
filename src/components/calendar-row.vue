<template>
  <div class="w-full flex flex-row gap-1 mb-4">
    <div
      v-for="day in days"
      :key="day.date"
      :class="['flex-auto', 'cursor-pointer']"
      @click="day.dateobj <= new Date().setHours(23, 59, 59, 999) ? selectDay(day) : null"
    >
      <div 
        :class="[
          'rounded-lg border-2 bg-white', 
          isSelected(day) ? 'border-violet-400 border-2' : 'border-slate-400 border-opacity-10',
        ]"
      >
        <div class="flex flex-col items-center">
          <span class="min-w-8 text-center text-xs sm:text-sm">{{ day.name }}</span>
          <RadialProgressbar
            :show="day.dateobj <= new Date().setHours(23, 59, 59, 999)"
            :progress="habitsProgress(day)"
            :size="24"
            :radius="40"
            :datenumber="day.date"
            style="margin-top:12px;"
            color="text-violet-400"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import RadialProgressbar from './RadialProgressbar.vue';
import { mapActions, mapState } from 'vuex';

export default {
  components: {
    RadialProgressbar,
  },
  data() {
    return {
      days: this.generateWeekDays(),
      selectedDay: null,
    };
  },
  mounted() {
    // Select today by default on mount
    const today = this.days.find(day => day.isToday);
    if (today) {
      this.selectDay(today);
    }
  },
  computed: {
    ...mapState(['habits', 'weekHabits']), // Map habits from the Vuex store
    habitsProgress() { // Rename for clarity
      return function(day) {
        if (!this.habits || !this.habits.length) {
          return 0;
        }
        let progress = 0;
        let totalDailyGoal = 0;

        const validHabitsStart = this.habits.filter(habit => habit.termStart.toDate()<=day.dateobj)

        const validHabits = validHabitsStart.filter(habit => 
        habit.termEnd===null || habit.termEnd.toDate()>=day.dateobj )

        validHabits.forEach(habit => {
          totalDailyGoal += habit.dailyGoal
        })
        const startDay = day.dateobj.setHours(0, 0, 0, 0)
        const endDay =day.dateobj.setHours(23, 59, 59, 999)

        this.weekHabits.forEach(habit => {
          const habitDate = habit.timestamp.toDate()

          if (habitDate <= endDay && habitDate >= startDay) {
            progress += habit.progress
          }
        })
        const totalProgress = (progress / totalDailyGoal) * 100
        return totalProgress;
      }
    
    },
  },
  methods: {
    ...mapActions(['updateSelectedDay']), // Map Vuex actions
    generateWeekDays() {
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();
      const currentDayOfWeek = today.getDay();
      const currentDate = today.getDate();

      const startOfWeek = new Date(today);
      startOfWeek.setDate(currentDate - currentDayOfWeek);

      return Array.from({ length: 7 }).map((_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);

        return {
          name: daysOfWeek[day.getDay()],
          date: day.getDate(),
          isToday: day.toDateString() === today.toDateString(),
          month: new Intl.DateTimeFormat("en-US", { month: "short" }).format(day), // Get month in words (like "Jan")
          dateobj: new Date(day),  // Store the Date object for comparison
        };
      });
    },
    selectDay(day) {
      this.selectedDay = day;
      const selectedDate = new Date(day.dateobj);
      this.updateSelectedDay(selectedDate); // Update the selected day in Vuex store
      this.$store.dispatch('getDayHabits');
    },
    isSelected(day) {
      // Check if the day is the selected day
      return this.selectedDay === day || (this.selectedDay === null && day.isToday);
    }
  },
};
</script>
