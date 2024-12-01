<template>
  <div class="flex flex-col bg-white rounded-lg p-4 text-center">
    <!-- Calendar Header -->
    <div class="flex justify-between items-center mb-4">
      <button class="text-gray-500 hover:text-gray-700 material-icons" @click="previousMonth">chevron_left</button>
      <span class="font-semibold text-lg">{{ currentMonthName }} {{ currentYear }}</span>
      <button class="text-gray-500 hover:text-gray-700 material-icons" @click="nextMonth">chevron_right</button>
    </div>

    <!-- Days of the Week -->
    <div class="w-full grid grid-cols-7 text-black mb-2 gap-x-1">
      <div v-for="day in daysOfWeek" :key="day" class="flex-1">{{ day }}</div>
    </div>

    <!-- Calendar Days -->
    <div class="grid grid-cols-7 text-center gap-1">
      <div
        v-for="(day, index) in calendarDays"
        :key="index"
        :class="[ 
          day.isToday ? 'text-purple-500' : '', 
          'relative', 'rounded-full', 
          'transition-colors duration-300' 
        ]"
      >
        <div class="flex flex-col items-center p-1 rounded-lg"
        :class="{ 'border':day.isCurrentMonth }">
          <!-- Show RadialProgressBar for current month and days up to today -->
          <RadialProgressbar
            :show="day.isCurrentMonth && (day.day <= today || currentMonth < todayMonth || currentYear < todayYear)"
            :progress="day.progress"
            :radius="40"
            :text="String(day.day)"
            :textcolor="day.isCurrentMonth? '#000000' : '#9ca3af'"
            :textsize="36"
            :strokeWidth="5"
            color="text-violet-400"
          />
          <div class="fill-violet-400 h-1 w-1 md:h-2 md:w-2"
          :class="{ 'invisible': !day.isToday }">
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
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default {
  components: {
    RadialProgressbar,
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
  computed: {
    currentMonthName() {
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
        'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      return monthNames[this.currentMonth];
    },
    ...mapState(['habits', 'weekProgress']),
  },
  methods: {
    previousMonth() {
      if (this.currentMonth === 0) {
        this.currentMonth = 11;
        this.currentYear--;
      } else {
        this.currentMonth--;
      }
      this.fetchProgress();
    },
    nextMonth() {
      if (this.currentMonth === 11) {
        this.currentMonth = 0;
        this.currentYear++;
      } else {
        this.currentMonth++;
      }
      this.fetchProgress();
    },
    fetchProgress() {
      const firstDayOfCurrentMonth = new Date(this.currentYear, this.currentMonth, 1);
      const q = query(
        collection(db, 'progress'),
        where('timestamp', '>=', firstDayOfCurrentMonth),
        orderBy('timestamp', 'desc')
      );

      onSnapshot(q, (querySnapshot) => {
        const progressArray = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          progressArray.push({ ...data, progressId: doc.id });
        });
        this.processProgressData(progressArray);
        
      });
    },
    processProgressData(progressArray) {
      const outputArray = progressArray.reduce((acc, curr) => {
        const currentDate = curr.timestamp.toDate ? curr.timestamp.toDate() : new Date(curr.timestamp);
        const currentDay = currentDate.setHours(0, 0, 0, 0);

        const existingHabit = acc.find(habit => {
          const habitDate = habit.timestamp.toDate ? habit.timestamp.toDate() : new Date(habit.timestamp);
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

      // Calculate the start and end of yesterday
      const now = new Date();
      const yesterdayStart = new Date(now.setDate(now.getDate() - 1)).setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(now.setDate(now.getDate() + 1)).setHours(0, 0, 0, -1); // End of yesterday

      // Filter outputArray for timestamps within yesterday's timeframe
      const filteredOutputArray = outputArray.filter(item => {
        const itemTimestamp = item.timestamp.toDate ? item.timestamp.toDate() : new Date(item.timestamp);
        return itemTimestamp >= yesterdayStart && itemTimestamp <= yesterdayEnd;
      });

      // Log the filtered output for yesterday
      //console.log('Entries for Yesterday:', filteredOutputArray);
      
      this.progressArray = outputArray;
      this.calculateMonthProgress();
    },
    calculateMonthProgress() {
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
        const dayDate = new Date(this.currentYear, this.currentMonth, i);
        const { totalProgress } = getTotalProgressDayForMonth(dayDate, this.progressArray, this.habits);
        
        days.push({
          day: i,
          isCurrentMonth: true,
          isToday: i === this.today && this.currentMonth === this.todayMonth && this.currentYear === this.todayYear,
          progress: totalProgress,
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
  },
  mounted() {
    this.fetchProgress();
  },
};
</script>

<style scoped>
.relative {
  position: relative;
}
</style>
