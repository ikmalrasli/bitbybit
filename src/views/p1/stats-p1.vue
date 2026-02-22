<template>
  <div class="w-full flex flex-col flex-grow">
    <!-- Header -->
    <header class="bg-white pt-1 pb-2 px-4 flex flex-row justify-between sticky top-0 z-20">
      <button class="material-icons rounded-full active:bg-gray-200" @click="previousMonth">chevron_left</button>
      <h1 class="text-xl text-black font-semibold">{{ currentMonthName }} {{ currentYear }}</h1>
      <button
        class="material-icons rounded-full active:bg-gray-200 disabled:text-gray-400"
        :disabled="currentMonth == todayMonth && currentYear == todayYear"
        @click="nextMonth"
      >
        chevron_right
      </button>
    </header>

    <!-- Content Section -->
    <div class="flex-grow flex flex-col overflow-hidden px-4">
      <!-- Fixed Overall Progress -->
      <div class="w-full p-2 bg-white border rounded-lg flex items-center h-24 md:h-28 shadow-sm sticky z-10">
        <template v-if="fetched">
          <h2 class="p-2 w-3/4 leading-tight">{{ mainText }}</h2>
          <div class="w-1/4 h-full">
            <RadialProgressbar
              :progress="Number(overallProgress)"
              :radius="40"
              :text="String(displayValue)"
              color="text-violet-400"
              class="cursor-pointer"
              @click="toggleGrade"
            />
          </div>
        </template>
        <template v-else>
          <!-- Skeleton Loader -->
          <div class="flex items-center w-full animate-pulse">
            <div class="w-3/4 h-6 bg-gray-200 rounded-md"></div>
            <div class="w-16 h-16 bg-gray-200 rounded-full ml-4"></div>
          </div>
        </template>
      </div>

      <!-- More Options Button (Dropdown Toggle) -->
      <div class="relative flex flex-row items-center p-2">
        <span class="font-semibold text-black">More info</span>
        <hr class="flex-grow border-t border-gray-300 mx-4" />
        <div class="space-x-1 flex items-center cursor-pointer" @click="toggleDropdown">
          <span class="material-icons rounded-full">sort</span>
          <span class="font-semibold">Sort</span>
        </div>
        <div
          v-if="isDropdownOpen"
          class="absolute right-0 z-50 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200"
          style="position: absolute; top: 100%;"
          @click.stop
        >
          <ul class="py-1 text-gray-700">
            <li
              @click="sortName"
              class="flex justify-between items-center px-4 py-2 text-md hover:bg-gray-100 cursor-pointer"
            >
              <span>Name</span>
              <span
                v-if="currentSort === 'name'"
                class="material-icons"
              >{{ sortNameAsc ? 'arrow_upward' : 'arrow_downward' }}</span>
            </li>
            <li
              @click="sortProgress"
              class="flex justify-between items-center px-4 py-2 text-md hover:bg-gray-100 cursor-pointer"
            >
              <span>Progress</span>
              <span
                v-if="currentSort === 'progress'"
                class="material-icons"
              >{{ sortProgressAsc ? 'arrow_upward' : 'arrow_downward' }}</span>
            </li>
            <li
              @click="sortColor"
              class="flex justify-between items-center px-4 py-2 text-md hover:bg-gray-100 cursor-pointer"
            >
              <span>Color</span>
              <span
                v-if="currentSort === 'color'"
                class="material-icons"
              >{{ sortColorAsc ? 'arrow_upward' : 'arrow_downward' }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Scrollable Habits List -->
      <div class="flex-grow overflow-y-auto pb-2" style="scrollbar-width: thin;">
        <div v-if="fetched && habitsMonth.length !== 0" class="space-y-1">
          <div v-if="showHabitsList" class="flex flex-col space-y-1">
            <div
              v-for="habit in habitsMonth"
              :key="habit.id"
              class="w-full min-h-18 p-4 bg-white border rounded-lg shadow-sm flex flex-row items-center justify-between cursor-pointer hover:bg-gray-100"
              @click="openDetail(habit)"
            >
              <div class="flex flex-row items-center">
                <div
                  class="h-3 w-3 md:h-4 md:w-4"
                  :class="habit.color ? `fill-${habit.color.default}` : 'fill-violet-400'"
                >
                  <svg class="h-full w-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" />
                  </svg>
                </div>
                <h2 class="p-2 w-full">{{ habit.name }}</h2>
              </div>
              <div class="flex flex-row items-center">
                <span
                  class="material-icons p-1"
                  :class="habit.color ? `text-${habit.color.default}` : 'text-violet-400'"
                >pie_chart</span>
                <h3 class="font-semibold text-center min-w-10">{{ habit.progressPercent }}%</h3>
                <span class="material-icons">chevron_right</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="fetched">
          <h2 class="mt-16 text-xl text-center block mb-2 h-full">No Habits in this month</h2>
        </div>
        <div v-else class="w-full h-full flex justify-center items-center">
          <!-- Skeleton Loader -->
          <div class="spinner"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import RadialProgressbar from '../../components/RadialProgressbar.vue';
import { db } from '../../db'; // Dexie IndexedDB
import { toMillis, toDate } from '../../utils/timestampUtils';
import { mapState } from 'vuex';
import { useStatStore } from '../../store/statStore.js';

export default {
  components: {
    RadialProgressbar
  },
  data() {
    const statStore = useStatStore();
    return {
      statStore,
      sortType: 'alphabetical',
      currentMonth: new Date().getMonth(),
      currentYear: new Date().getFullYear(),
      today: new Date().getDate(),
      todayMonth: new Date().getMonth(),
      todayYear: new Date().getFullYear(),
      mainText: '',
      overallProgress: 0,
      showGrade: true,
      fetched: false,
      isDropdownOpen: false,
      sortNameAsc: true,
      sortProgressAsc: true,
      sortColorAsc: true,
      currentSort: 'name',
      showHabitsList: false,
    }
  },
  computed: {
    currentMonthName() {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ];
      return monthNames[this.currentMonth];
    },
    ...mapState(['habits']),
    currentMonthYear() {
      return `${this.currentMonth}-${this.currentYear}`;
    },
    displayValue() {
      if (this.showGrade) {
        return this.getGrade(this.overallProgress); // Show grade if toggled
      }
      return this.overallProgress; // Otherwise, show progress
    },
    habitsMonth(){
      return this.statStore.getHabitsForMonth(this.currentMonth, this.currentYear);
    },
  },
  methods: {
    clicked(){
      //console log habits cache from statStore
      console.log(this.statStore.habitsCache)
    },
    previousMonth() {
      if (this.currentMonth === 0) {
          this.currentMonth = 11;
          this.currentYear--;
      } else {
          this.currentMonth--;
      }
      this.statStore.setMonthAndYear(this.currentMonth, this.currentYear);
      this.$router.push('/stats');
    },
    nextMonth() {
      if (this.currentMonth === this.todayMonth && this.currentYear === this.todayYear) {
        return;
      }
      if (this.currentMonth === 11) {
        this.currentMonth = 0;
        this.currentYear++;
      } else {
        this.currentMonth++;
      }
      this.statStore.setMonthAndYear(this.currentMonth, this.currentYear);
      this.$router.push('/stats');
    },
    toggleSort() {
      if (this.sortType === 'alphabetical') {
        this.habitsMonth.sort((a, b) => (b.totalProgress * 100 / b.totalGoals) - (a.totalProgress * 100 / a.totalGoals));
        this.sortType = 'progress';
      } else {
        this.habitsMonth.sort((a, b) => a.name.localeCompare(b.name));
        this.sortType = 'alphabetical';
      }
    },
    toggleGrade() {
      this.showGrade = !this.showGrade;
    },
    updateMainText() {
      const grade = this.overallProgress;

      if (this.currentMonth === this.todayMonth && this.currentYear === this.todayYear) {
        // Ongoing Month Messages
        if (grade >= 80) {
          this.mainText = "Fantastic effort so far! Keep up the great work to finish strong!";
        } else if (grade >= 60) {
          this.mainText = "You're doing well! A little more effort could push you over the top.";
        } else if (grade >= 40) {
          this.mainText = "Keep going! There's still time to reach your goal this month.";
        } else if (grade >= 20) {
          this.mainText = "Progress is coming along—stay consistent, and results will follow!";
        } else {
          this.mainText = "Every small step counts. Let's make a push to improve this month!";
        }
      } else if (this.currentMonth < this.todayMonth && this.currentYear <= this.todayYear) {
        // Past Month Messages
        if (grade >= 80) {
          this.mainText = "Outstanding! You completed this month’s goals with flying colors.";
        } else if (grade >= 60) {
          this.mainText = "Great job! You made solid progress and met most of your goals.";
        } else if (grade >= 40) {
          this.mainText = "Good effort! Though there was room for improvement, every bit counts.";
        } else if (grade >= 20) {
          this.mainText = "Some progress made, though there were more opportunities to grow.";
        } else {
          this.mainText = "A fresh start awaits! Use last month’s results as motivation to improve.";
        }
      }
    },
    getGrade(progress) {
      if (progress >= 80) return 'A';
      if (progress >= 60) return 'B';
      if (progress >= 40) return 'C';
      if (progress >= 20) return 'D';
      return 'F'; // For progress less than 20%
    },
    async fetchHabitsMonth() {
      this.fetched = false;
      this.showHabitsList = false;
      const fetchedHabits = await this.getMonthStats();
      this.statStore.setHabitsForMonth(fetchedHabits, this.currentMonth, this.currentYear);
      this.overallProgress = this.calcOverallProgress(fetchedHabits);
      this.fetched = true;
      setTimeout(() => {
        this.showHabitsList = true;
      }, 50)
    },
    async refreshHabitsMonthInBackground() {
      const fetchedHabits = await this.getMonthStats();
      this.statStore.setHabitsForMonth(fetchedHabits, this.currentMonth, this.currentYear);
      this.overallProgress = this.calcOverallProgress(fetchedHabits);
      this.updateMainText();
    },
    ensureMonthDataLoaded() {
      const cached = this.statStore.getHabitsForMonth(this.currentMonth, this.currentYear);
      const needsRefresh = this.statStore.progressUpdated;

      if (cached) {
        this.fetched = true;
        this.showHabitsList = true;
        this.overallProgress = this.calcOverallProgress(cached);
        this.updateMainText();
        if (needsRefresh) {
          this.statStore.resetProgressUpdated();
          this.refreshHabitsMonthInBackground();
        }
      } else {
        this.statStore.resetProgressUpdated();
        this.fetchHabitsMonth();
      }
    },
    async getMonthStats() {
      const endOfMonth = new Date(this.currentYear, this.currentMonth + 1, 0).setHours(23, 59, 59, 999);
      
      const validHabits = this.habits.filter(habit => {
        const termStart = toDate(habit.termStart);
        return termStart <= endOfMonth
      });

      return await Promise.all(
        validHabits.map(async (habit) => {
          let totalGoals = this.getDailyGoalsInMonth(habit);
          let totalProgress = await this.getProgressInMonth(habit);

          if (totalProgress > totalGoals) {
            totalProgress = totalGoals;
          }

          const progressPercent = totalGoals > 0 ? Number((totalProgress * 100 / totalGoals).toFixed(0)) : 0;
          
          return { ...habit, totalGoals, totalProgress, progressPercent };
        })
      );
    },
    getDailyGoalsInMonth(habit) {
      let dayCounts = 0;
      let endDate = new Date().getDate();
      if (this.currentYear != this.todayYear || this.currentMonth != this.todayMonth) {
        endDate = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
      }

      for (let day = 1; day <= endDate; day++) {
        const date = new Date(this.currentYear, this.currentMonth, day);
        const dayOfWeek = date.toLocaleString("en-US", { weekday: "short" }).toLowerCase();
        const termStart = toDate(habit.termStart);
        const termEnd = habit.termEnd ? toDate(habit.termEnd) : null;
        if (habit.repeat && habit.repeat[dayOfWeek] &&
            termStart.setHours(0, 0, 0, 0) <= date &&
          (habit.termEnd == null || termEnd > date)
            && !this.isHabitPausedOnDay(habit.habitId, date, this.$store.state.pauses)
          ) {
          dayCounts++;
        }
      }
      return dayCounts * habit.dailyGoal;
    },
    async getProgressInMonth(habit) {
      let totalProgress = 0;

      // Define the start and end of the month (in milliseconds for Dexie)
      const startOfMonth = new Date(this.currentYear, this.currentMonth, 1, 0, 0, 0, 0);
      const startOfMonthMs = startOfMonth.getTime();
      const endOfMonth = new Date(this.currentYear, this.currentMonth + 1, 0, 23, 59, 59, 999);
      const endOfMonthMs = endOfMonth.getTime();

      // Query Dexie for progress documents for this habit within the month
      const progressDocs = await db.progress
        .where('habitId')
        .equals(habit.habitId)
        .toArray();

      // Filter by timestamp range and process
      const dailyProgressMap = {};

      progressDocs
        .filter(doc => doc.timestamp >= startOfMonthMs && doc.timestamp <= endOfMonthMs)
        .sort((a, b) => b.timestamp - a.timestamp) // Sort descending by timestamp
        .forEach((doc) => {
          const progressDate = new Date(doc.timestamp);
          const dayKey = `${progressDate.getFullYear()}-${String(progressDate.getMonth() + 1).padStart(2, '0')}-${String(progressDate.getDate()).padStart(2, '0')}`;

          // Only keep the latest document for each day
          if (!dailyProgressMap[dayKey]) {
            if (!this.isHabitPausedOnDay(habit.habitId, progressDate, this.$store.state.pauses)) {
              dailyProgressMap[dayKey] = Number(doc.progress);
            }
          }
        });

      // Sum up the daily progress values
      totalProgress = Object.values(dailyProgressMap).reduce((sum, progress) => sum + progress, 0);

      return totalProgress;
    },
    calcOverallProgress(habits) {
      let goals = 0;
      let progress = 0;

      habits.forEach((habit) => {
        if (habit.totalProgress != null) {
          progress += habit.totalProgress;
          goals += habit.totalGoals;
        }
      });

      return goals ? (progress * 100 / goals).toFixed(0) : 0;
    },
    isHabitPausedOnDay(habitId, day, pauses) {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      return pauses?.some(pause => {
        if (pause.habitId !== habitId) return false;
        const start = pause.start.toDate ? pause.start.toDate() : new Date(pause.start.seconds * 1000);
        const end = pause.end
          ? (pause.end.toDate ? pause.end.toDate() : new Date(pause.end.seconds * 1000))
          : null;
        if (end) {
          end.setHours(23, 59, 59, 999);
          return dayStart >= start && dayEnd <= end;
        } else {
          return dayStart >= start;
        }
      });
    },
    openDetail(habit) {
      this.statStore.selectStat(habit);

      this.$router.push({
        name: 'detail-stats',
        params: { habitId: habit.habitId, timestamp: this.currentMonthYear }
      });
    },
    // Back and Dropdown Functions
    toggleDropdown(event) {
      event.stopPropagation(); // Prevent the outside click listener from being triggered
      this.isDropdownOpen = !this.isDropdownOpen;

      // If the dropdown is open, add the click listener to detect clicks outside
      if (this.isDropdownOpen) {
        document.addEventListener('click', this.handleClickOutside);
      } else {
        document.removeEventListener('click', this.handleClickOutside);
      }
    },
    handleClickOutside(event) {
      const dropdown = this.$el.querySelector('.absolute');
      if (dropdown && !dropdown.contains(event.target)) {
        this.isDropdownOpen = false;  // Close dropdown
        document.removeEventListener('click', this.handleClickOutside); // Remove the event listener
      }
    },
    sortName() {
      this.habitsMonth.sort((a, b) => this.sortNameAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
      this.sortNameAsc = !this.sortNameAsc;
      this.currentSort = 'name'; // Set active sort to 'name'
      this.isDropdownOpen = false;
      document.removeEventListener('click', this.handleClickOutside);
    },
    sortProgress() {
      this.habitsMonth.sort((a, b) => this.sortProgressAsc ? a.progressPercent - b.progressPercent : b.progressPercent - a.progressPercent);
      this.sortProgressAsc = !this.sortProgressAsc;
      this.currentSort = 'progress'; // Set active sort to 'progress'
      this.isDropdownOpen = false;
      document.removeEventListener('click', this.handleClickOutside);
    },
    sortColor() {
      // Define color order based on listColors
      const colorOrder = {
        "red-300": 0,
        "orange-300": 1,
        "yellow-300": 2,
        "emerald-300": 3,
        "blue-300": 4,
        "pink-300": 5,
        "violet-400": 6
      };

      // Sort habitsMonth based on the colorOrder
      this.habitsMonth.sort((a, b) => {
        const colorA = colorOrder[a.color?.default || "violet-400"] ?? 99;
        const colorB = colorOrder[b.color?.default || "violet-400"] ?? 99;
        
        return this.sortColorAsc ? colorA - colorB : colorB - colorA;
      });

      // Toggle the sorting order and set current sort
      this.sortColorAsc = !this.sortColorAsc;
      this.currentSort = 'color';
      this.isDropdownOpen = false;
      document.removeEventListener('click', this.handleClickOutside);
    },
  },
  watch: {
    currentMonthYear() {
      this.ensureMonthDataLoaded();
    },
    overallProgress(newVal) {
      this.updateMainText();
    },
  },
  mounted() {
    this.statStore.setMonthAndYear(this.currentMonth, this.currentYear);
    this.ensureMonthDataLoaded();
  }
}
</script>

<style scoped>
.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #a78bfa; /* Change color as needed */
  border-radius: 50%;
  width: 28px; /* Spinner size */
  height: 28px; /* Spinner size */
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Skeleton Loading Animation */
.animate-pulse {
  @apply rounded-md;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

/* Transition for slide-fade */
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter-from, .slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* Transition for expand-collapse */
.expand-collapse-enter-active, .expand-collapse-leave-active {
  transition: all 0.3s ease;
}
.expand-collapse-enter, .expand-collapse-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>