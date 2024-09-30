<template>
    <div class="w-full flex flex-col flex-grow p-2 sm:p-4">
      <div class="w-full flex flex-col p-4 mb-4 text-gray-700 bg-white bg-clip-border rounded-lg border">
        <span class="font-semibold text-lg text-center mb-4">This week</span>
        <div class="w-full flex flex-row gap-1">
          <div v-for="day in days" :key="day.date" class="w-full">
            <div class="w-full grid justify-items-center">
              <VerticalProgressbar
                :percent="habitsProgress(day.dateobj)"
                color="bg-violet-400"
              />
              <div class="flex flex-col items-center">
                <span class="flex mt-2" :class="{ 'text-violet-400 font-semibold': day.dateobj.getDate() === new Date().getDate() }">{{ day.name }}</span>
                <svg v-if="day.dateobj.getDate() === new Date().getDate()" class="fill-violet-400 w-2 h-2">
                  <circle r="3" cx="3" cy="3" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CalendarMonth class="flex-grow w-full border" />
    </div>
  </template>
  
  <script>
  import CalendarMonth from "../../components/calendar-month.vue";
  import VerticalProgressbar from "../../components/VerticalProgressbar.vue";
  import { mapState } from "vuex";
  import { getTotalProgressDay } from "../../utils/getTotalProgressDay"; // Import the utility
  
  export default {
    components: {
      CalendarMonth,
      VerticalProgressbar,
    },
    data() {
      return {
        days: this.generateWeekDays(), // Dynamically generate the week days
      };
    },
    computed: {
      ...mapState(["weekProgress", "habits"]), // Map Vuex state for progress and habits
    },
    methods: {
      generateWeekDays() {
        const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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
            dateobj: new Date(day),
          };
        });
      },
      habitsProgress(day) {
        // Use getTotalProgressDay to calculate the progress for each day
        const { totalProgress } = getTotalProgressDay(day, this.weekProgress, this.habits);
        return totalProgress;
      },
    },
  };
  </script>
  