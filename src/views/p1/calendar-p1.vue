<template>
  <div class="w-full flex flex-col flex-grow px-4 py-2">
    <!-- weekly section -->
    <div class="w-full flex flex-col p-4 mb-4 text-gray-700 bg-white bg-clip-border rounded-lg border">
      <div class="flex justify-between items-center mb-4">
        <button class="text-gray-500 hover:text-gray-700 material-icons" :class="{ 'invisible': currentWeek === 'lastWeek' }" @click="showLastWeek">chevron_left</button>
        <span class="font-semibold text-lg text-center">{{ weekTitle }}</span>
        <button class="text-gray-500 hover:text-gray-700 material-icons" :class="{ 'invisible': currentWeek === 'thisWeek' }" @click="showThisWeek">chevron_right</button>
      </div>

      <div class="w-full flex flex-row gap-1">
        <div v-for="day in days" :key="day.date" class="w-full">
          <div class="w-full grid justify-items-center">
            <VerticalProgressbar
              :percent="habitsProgress(day.dateobj)"
              color="bg-violet-400"
              :bgcolor="day.dateobj.getDate() <= new Date().getDate() ? 'bg-gray-200' : 'bg-gray-300'"
            />
            <div class="flex flex-col items-center">
              <span class="flex mt-2" :class="{ 'text-violet-400 font-semibold': day.dateobj.getDate() === new Date().getDate() }">{{ day.name }}</span>
              <svg class="fill-violet-400 w-2 h-2" :class="{ 'invisible': day.dateobj.getDate() != new Date().getDate() }">
                <circle r="3" cx="3" cy="3" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- monthly section -->
    <CalendarMonth class="flex-grow w-full border" />
  </div>
</template>

<script>
import CalendarMonth from "../../components/calendar-month.vue";
import VerticalProgressbar from "../../components/VerticalProgressbar.vue";
import { mapState } from "vuex";
import { getTotalProgressDay } from "../../utils/getTotalProgressDay";
import { getTotalProgressDayForMonth } from "../../utils/getTotalProgressDayForMonth";

export default {
  components: {
    CalendarMonth,
    VerticalProgressbar,
  },
  data() {
    return {
      currentWeek: 'thisWeek', // Tracks which week is being viewed
      days: this.generateWeekDays('thisWeek'), // Initializes with current week
    };
  },
  computed: {
    ...mapState(["weekProgress", "habits"]),
    weekTitle() {
      return this.currentWeek === 'thisWeek' ? 'This Week' : 'Last Week';
    }
  },
  methods: {
    generateWeekDays(week) {
      const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const today = new Date();
      const currentDayOfWeek = today.getDay();

      let startOfWeek;

      if (week === 'thisWeek') {
        startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - currentDayOfWeek);
      } else if (week === 'lastWeek') {
        startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - currentDayOfWeek - 7); // Subtract 7 days for last week
      }

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
      const { totalProgress } = getTotalProgressDay(day, this.weekProgress, this.habits);
      return totalProgress;
    },
    showLastWeek() {
      this.currentWeek = 'lastWeek';
      this.days = this.generateWeekDays('lastWeek'); // Re-generate days for last week
    },
    showThisWeek() {
      this.currentWeek = 'thisWeek';
      this.days = this.generateWeekDays('thisWeek'); // Re-generate days for this week
    },
  },
};
</script>
