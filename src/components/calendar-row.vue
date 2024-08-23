<template>
  <div class="w-full flex flex-row gap-1 mb-4">
    <div
      v-for="day in days"
      :key="day.date"
      :class="['flex-auto', 'cursor-pointer']"
      @click="day.dateobj <= new Date() ? selectDay(day) : null"
    >
      <div 
        :class="[
          'rounded-lg border bg-white', 
          isSelected(day) ? 'border-violet-400 border-2' : 'border-slate-400',
        ]"
      >
        <div class="flex flex-col items-center">
          <span class="min-w-8 text-xs sm:text-sm">{{ day.name }}</span>
          <RadialProgressbar
            :show="day.dateobj <= new Date()"
            :progress="day.progress"
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
  methods: {
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
          progress: this.calculateProgress(day, today),
          // Get month in words (like "Jan")
          month: new Intl.DateTimeFormat("en-US", { month: "short" }).format(day),
          dateobj: new Date(day),  // Store the Date object for comparison
        };
      });
    },
    calculateProgress(day, today) {
      if (day > today) return 0;
      return Math.floor(Math.random() * 101);
    },
    selectDay(day) {
      this.selectedDay = day;

      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      // Remove time from comparison by setting hours to 00:00:00
      const selectedDate = new Date(day.dateobj);
      selectedDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      yesterday.setHours(0, 0, 0, 0);

      if (selectedDate.getTime() === today.getTime()) {
        this.$emit("date-selected", "Today");
      } else if (selectedDate.getTime() === yesterday.getTime()) {
        this.$emit("date-selected", "Yesterday");
      } else {
        this.$emit("date-selected", `${day.date} ${day.month}`);
      }
    },
    isSelected(day) {
      // Check if the day is the selected day
      return this.selectedDay === day || (this.selectedDay === null && day.isToday);
    }
  },
};
</script>
