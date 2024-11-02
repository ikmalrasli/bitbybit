<template>
  <div class="w-full px-4">
    <!-- Header -->
    <header class="bg-white pt-2 pb-4 px-4 flex flex-row relative justify-between">
      <button class="material-icons rounded-full active:bg-gray-200" @click="previousMonth">chevron_left</button>
      <h1 class="text-xl text-black font-semibold">{{ currentMonthName }} {{ currentYear }}</h1>
      <button class="material-icons rounded-full active:bg-gray-200 disabled:text-gray-400"
        :disabled="currentMonth == todayMonth && currentYear == todayYear"
        @click="nextMonth">chevron_right</button>
    </header>

    <div v-if="fetched" class="overflow-y-auto h-full">
      <div v-if="habitsMonth.length !== 0">
      <div class="w-full p-4 bg-white border rounded-lg flex flex-row items-center">
        <h2 class="p-2 font-semibold w-3/4">{{ mainText }}</h2>
        <div class="w-1/4">
          <RadialProgressbar
            :progress="Number(overallProgress)"
            :radius="40"
            :text="String(displayValue)"
            color="text-violet-400"
            class="cursor-pointer"
            @click="toggleGrade"
          />
        </div>
      </div>

      
        <div class="p-4 flex items-center justify-between">
          <span class="font-semibold text-black">More info</span>
          <hr class="flex-grow border-t border-gray-300 mx-4" />

          <!-- More Options Button (Dropdown Toggle) -->
          <div class="relative">
            <!-- Dropdown Toggle Button -->
             <div class="space-x-1 flex items-center cursor-pointer" @click="toggleDropdown">
              <span class="material-icons rounded-full">sort</span>
              <span class="font-semibold">Sort</span>
             </div>

            <!-- Dropdown Menu -->
            <div v-if="isDropdownOpen" class="absolute right-0 z-10 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200" @click.stop>
              <ul class="py-1 text-gray-700">
                <li @click="sortName" class="flex justify-between items-center px-4 py-2 text-md hover:bg-gray-100 cursor-pointer">
                  <span>Name</span>
                  <span v-if="currentSort === 'name'" class="material-icons">{{ sortNameAsc ? 'arrow_upward' : 'arrow_downward' }}</span>
                </li>
                <li @click="sortProgress" class="flex justify-between items-center px-4 py-2 text-md hover:bg-gray-100 cursor-pointer">
                  <span>Progress</span>
                  <span v-if="currentSort === 'progress'" class="material-icons">{{ sortProgressAsc ? 'arrow_upward' : 'arrow_downward' }}</span>
                </li>
                <li @click="sortColor" class="flex justify-between items-center px-4 py-2 text-md hover:bg-gray-100 cursor-pointer">
                  <span>Color</span>
                  <span v-if="currentSort === 'color'" class="material-icons">{{ sortColorAsc ? 'arrow_upward' : 'arrow_downward' }}</span>
                </li>
              </ul>
            </div>

          </div>
        </div>

        <div class="space-y-1">
          <div
            v-for="habit in habitsMonth"
            :key="habit.id">
            <div class="w-full p-4 bg-white border rounded-lg flex flex-row items-center justify-between cursor-pointer hover:bg-gray-100"
            @click="openDetail(habit)">
              <div class="flex flex-row items-center w-3/4">
                <div class="h-2 w-2 md:h-4 md:w-4" :class="habit.color ?`fill-${habit.color.default}`: 'fill-violet-400'">
                  <svg class="h-full w-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" />
                  </svg>
                </div>
                <h2 class="p-2 font-semibold w-3/4">{{ habit.name }}</h2>
              </div>
              <div class="flex flex-row items-center w-1/4">
                <span class="material-icons" :class="habit.color ? `text-${habit.color.default}`: 'text-violet-400'">pie_chart</span>
                <h3 class="p-2 font-semibold min-w-10">{{ habit.progressPercent }}%</h3>
                <span class="material-icons">chevron_right</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else>
        <h2 class="mt-16 text-xl text-center block mb-2 h-full">No Habits in this month</h2>
      </div>
    </div>
    <!--<div v-else class="flex justify-center items-center h-64">
      <div class="spinner"></div>
    </div>-->
    <!-- Skeleton Loader -->
    <div v-else class="space-y-4 p-4">
      <!-- Main Text Skeleton -->
      <div class="w-full h-8 bg-gray-200 rounded-md animate-pulse"></div>
      
      <!-- Habit Item Skeletons -->
      <div v-for="n in 3" :key="n" class="w-full p-4 bg-gray-200 border rounded-lg flex flex-row items-center animate-pulse">
        <div class="h-6 w-6 bg-gray-300 rounded-full"></div>
        <div class="ml-4 w-3/4 h-6 bg-gray-300 rounded-md"></div>
        <div class="ml-auto w-1/4 h-6 bg-gray-300 rounded-md"></div>
      </div>
    </div>

  </div>
</template>

<script>
import RadialProgressbar from '../../components/RadialProgressbar.vue';
import { query, collection, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
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
      habitsMonth: [],
      showGrade: true,
      fetched: false,
      isDropdownOpen: false,
      sortNameAsc: false,
      sortProgressAsc: true,
      sortColorAsc: true,
      currentSort: 'name',
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
  },
  methods: {
    updateState() {
      this.statStore.setMonthAndYear(this.currentMonth, this.currentYear);
      this.fetchHabitsMonth();
    },
    previousMonth() {
      if (this.currentMonth === 0) {
          this.currentMonth = 11;
          this.currentYear--;
      } else {
          this.currentMonth--;
      }
      this.updateState();
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
      this.updateState();
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
      const cachedHabits = this.statStore.getHabitsForMonth(this.currentMonth, this.currentYear);
      if (cachedHabits) {
        this.habitsMonth = cachedHabits;
        this.overallProgress = this.calcOverallProgress(cachedHabits);
        this.fetched = true;
      } else {
        this.fetched = false;
        const fetchedHabits = await this.getMonthStats();
        this.habitsMonth = fetchedHabits;
        this.overallProgress = this.calcOverallProgress(fetchedHabits);
        this.statStore.setHabitsForMonth(fetchedHabits, this.currentMonth, this.currentYear);
        this.fetched = true;
      }
    },
    async getMonthStats() {
      const endOfMonth = new Date(this.currentYear, this.currentMonth + 1, 0).setHours(23, 59, 59, 999);
      
      const validHabits = this.habits.filter(habit => habit.termStart.toDate() <= endOfMonth);

      return await Promise.all(
        validHabits.map(async (habit) => {
          let totalGoals = this.getDailyGoalsInMonth(habit);
          let totalProgress = await this.getProgressInMonth(habit);

          if ( totalProgress > totalGoals) {
            totalProgress = totalGoals
          }
          const progressPercent = Number((totalProgress * 100 / totalGoals).toFixed(0));
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

        if (habit.repeat && habit.repeat[dayOfWeek] &&
            habit.termStart.toDate().setHours(0, 0, 0, 0) <= date &&
            (habit.termEnd == null || habit.termEnd.toDate() > date)) {
          dayCounts++;
        }
      }
      return dayCounts * habit.dailyGoal;
    },
    async getProgressInMonth(habit) {
      let totalProgress = 0;

      // Define the start and end of the month
      const startOfMonth = new Date(this.currentYear, this.currentMonth, 1, 0, 0, 0, 0);
      const endOfMonth = new Date(this.currentYear, this.currentMonth + 1, 0, 23, 59, 59, 999);

      // Query all progress documents for this habit within the month
      const q = query(
        collection(db, "progress"),
        where("timestamp", ">=", startOfMonth),
        where("timestamp", "<=", endOfMonth),
        where("habitId", "==", habit.habitId),
        orderBy("timestamp", "desc") // Order by timestamp to help with filtering the latest entries
      );

      // Fetch all documents in the range
      const querySnapshot = await getDocs(q);

      // Process documents to get the latest entry per day
      const dailyProgressMap = {};

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const progressDate = new Date(data.timestamp.toDate());
        const dayKey = `${progressDate.getFullYear()}-${String(progressDate.getMonth() + 1).padStart(2, '0')}-${String(progressDate.getDate()).padStart(2, '0')}`;

        // Only keep the latest document for each day
        if (!dailyProgressMap[dayKey]) {
          dailyProgressMap[dayKey] = Number(data.progress); // Save the first (latest) document per day
        }
      });
      //console.log(habit.name+':',dailyProgressMap)
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
    currentMonthYear(newVal, oldVal) {
      this.updateMainText();
      this.fetchHabitsMonth();
    },
    overallProgress(newVal) {
      this.updateMainText();
    }
  },
  mounted() {
    this.updateMainText();
    this.fetchHabitsMonth();
    this.statStore.setMonthAndYear(this.currentMonth, this.currentYear);
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
  @apply bg-gray-200 rounded-md;
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
</style>