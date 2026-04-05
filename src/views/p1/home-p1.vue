<template>
  <div class=" w-full flex flex-row flex-grow px-4">
    <!-- Main content -->
    <div class="flex-auto justify-center ">
      <!-- if no habits exist (user first time)-->
      <div v-if="!hasAnyHabit" class="w-full p-4 mt-4 mb-4 text-gray-700">
        <p class="text-center">No Habits</p>
        <p class="text-center">
          Tap the
          <span class="inline-flex items-center mx-1">
            <span class="material-icons text-base">add</span>
          </span>
          button
        </p>
      </div>

      <!-- if no habits exist but user selected date before any habits started-->
      <div v-if="hasAnyHabit && habits.length === 0" class="w-full p-4 mt-4 mb-4 text-gray-700">
        <p class="text-center">No Habits started yet for this date</p>
      </div>

      <!-- Habits exist-->
      <!-- Collapsible Section -->
      <div class="mt-1 space-y-4 pb-16">
        <!-- Uncompleted habits (expand/collapse) -->
        <div v-if="uncompletedHabits.length !== 0">
          <div class="flex items-center justify-between cursor-pointer" @click="toggleSection('Uncompleted')">
            <div class="flex items-center">
              <span class="font-semibold text-black">Uncompleted</span>
              <span class="pl-3 text-gray-500">{{ uncompletedHabits.length }}</span>
            </div>
            <hr class="flex-grow border-t border-gray-300 mx-4" />
            <div class="flex items-center">
              <span v-if="showUncompleted" class="material-icons">keyboard_arrow_up</span>
              <span v-else class="material-icons">keyboard_arrow_down</span>
            </div>
          </div>

          <!-- Uncompleted habits List with Transition -->
          <transition name="slide-fade">
            <div v-if="showUncompleted" class="py-4 space-y-1">
              <div v-for="(habit, index) in uncompletedHabits" :key="index">
                <HomeProgress :percent="habit.actualProgress * 100 / habit.dailyGoal" :text="habit.name"
                  :timesdone="habit.actualProgress + '/' + habit.dailyGoal"
                  :color="habit.color ? `bg-${habit.color.default}` : 'bg-violet-400'" class="cursor-pointer"
                  :selectionMode="uiStore.selectionMode"
                  :isSelected="uiStore.selectedHabits.includes(habit.id)"
                  :bgColor="habit === $store.state.selectedHabit ? 'bg-gray-50' : ''"
                  :showDot="habit.reminders ? showDot(habit) : false"
                  :subtext="habit.reminders ? formatReminderTimes(habit.reminders) : ''" :isPaused="habit?.isPaused"
                  @toggleSelect="uiStore.selectHabit(habit.id)" 
                  @openDetail="openDetail(habit)" />
              </div>
            </div>
          </transition>
        </div>

        <!-- Paused habits (expand/collapse) -->
        <div v-if="pausedHabits.length !== 0">
          <div class="flex items-center justify-between cursor-pointer" @click="toggleSection('Paused')">
            <div class="flex items-center">
              <span class="font-semibold text-black">Paused</span>
              <span class="pl-3 text-gray-500">{{ pausedHabits.length }}</span>
            </div>
            <hr class="flex-grow border-t border-gray-300 mx-4" />
            <div class="flex items-center">
              <span v-if="showPaused" class="material-icons">keyboard_arrow_up</span>
              <span v-else class="material-icons">keyboard_arrow_down</span>
            </div>
          </div>
          <transition name="slide-fade">
            <div v-if="showPaused" class="py-4 space-y-1">
              <div v-for="(habit, index) in pausedHabits" :key="index">
                <HomeProgress :percent="0" :text="habit.name" :timesdone="'Paused'"
                  :color="habit.color ? `bg-${habit.color.default}` : 'bg-gray-300'" class="opacity-70" :isPaused="true"
                  @openDetail="openDetail(habit)" />
              </div>
            </div>
          </transition>
        </div>

        <!-- Completed habits (expand/collapse) -->
        <div v-if="completedHabits.length !== 0">
          <div class="flex items-center justify-between cursor-pointer" @click="toggleSection('Completed')">
            <div class="flex items-center">
              <span class="font-semibold text-black">Completed</span>
              <span class="pl-3 text-gray-500">{{ completedHabits.length }}</span>
            </div>
            <hr class="flex-grow border-t border-gray-300 mx-4" />
            <div class="flex items-center">
              <span v-if="showCompleted" class="material-icons">keyboard_arrow_up</span>
              <span v-else class="material-icons">keyboard_arrow_down</span>
            </div>
          </div>

          <!-- Completed habits List with Transition -->
          <transition name="slide-fade">
            <div v-if="showCompleted" class="py-4 space-y-1">
              <div v-for="(habit, index) in completedHabits" :key="index">
                <HomeProgress :percent="habit.actualProgress * 100 / habit.dailyGoal" :text="habit.name"
                  :timesdone="habit.actualProgress + '/' + habit.dailyGoal"
                  :color="habit.color ? `bg-${habit.color.default}` : 'bg-violet-400'" class="cursor-pointer"
                  @click="openDetail(habit)" />
              </div>
            </div>
          </transition>
        </div>

        <!--Memos (expand/collapse) -->
        <div v-if="dayMemos.length !== 0">
          <div class="flex items-center justify-between cursor-pointer" @click="toggleSection('Memos')">
            <div class="flex items-center">
              <span class="font-semibold text-black">Memos</span>
              <span class="pl-3 text-gray-500">{{ dayMemos.length }}</span>
            </div>
            <hr class="flex-grow border-t border-gray-300 mx-4" />
            <div class="flex items-center">
              <span v-if="showMemos" class="material-icons">keyboard_arrow_up</span>
              <span v-else class="material-icons">keyboard_arrow_down</span>
            </div>
          </div>

         
          <transition name="slide-fade">
            <div v-if="showMemos" class="py-4 space-y-1">
              <div v-for="(memo, index) in dayMemos" :key="index">
                <div
                  class="flex flex-col p-2 bg-white border rounded-lg shadow-sm space-y-1 cursor-pointer hover:bg-gray-50"
                  @click="viewMemo(memo)">
                  <div class="flex w-full p-2 flex-row justify-between">
                    
                    <span class="truncate-text">{{ memo.memo }}</span>
                  </div>
                  <div class="flex w-full justify-end">
                    <span
                      class="text-xs text-nowrap font-medium text-black text-opacity-50 rounded-full py-0.5 px-2 bg-black bg-opacity-5">{{
                        memoCategory(memo?.category) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import { memoService } from '../../services/memoService';
import calendarRow from "../../components/calendar-row.vue";
import HomeProgress from "../../components/habitpb.vue";
import fab from "../../components/fab.vue";
import { useDialogStore } from '../../store/dialogStore';
import { useHabitStore } from '../../store/habitStore';
import { useMemoStore } from '../../store/memoStore';
import { useUIStore } from '../../store/uiStore';
import { useUserStore } from '../../store/userStore';
import { getLocalDateKey } from '../../utils/dateHelpers';

export default {
  components: {
    calendarRow,
    HomeProgress,
    fab
  },
  data() {
    return {
      showUncompleted: true,
      showCompleted: true,
      showPaused: true,
      showMemos: true,
      showDeleteButton: {},
      dialogStore: useDialogStore(),
      uiStore: useUIStore(),
      habitStore: useHabitStore(),
      memoStore: useMemoStore(),
    };
  },
  mounted() {
    // Check if any habit exists
    this.habitStore.checkIfAnyHabitExists();

    // Get habit metrics for this week and last week
    const today = new Date();
    const startOfLastWeek = new Date(today);
    startOfLastWeek.setDate(today.getDate() - today.getDay() - 14);
    startOfLastWeek.setHours(0, 0, 0, 0);
    
    this.habitStore.getHabitMetrics(startOfLastWeek, today);
    this.memoStore.getMemos(startOfLastWeek, today);
    
    // Add debug info about user authentication
    const userStore = useUserStore();
  },
  computed: {
    // Get selected date from habitStore (which is passed from calendar-row component)
    selectedDay() {
      return this.uiStore.selectedDate;
    },
    hasAnyHabit() {
      return this.habitStore.hasAnyHabit;
    },
    habits() {
      const dateKey = getLocalDateKey(this.selectedDay);
      const habits = this.habitStore.dayHabitMetrics[dateKey] || [];
      
      // Apply sorting based on the sortType from uiStore
      return this.habitStore.sortHabits ? 
        this.habitStore.sortHabitsSync(habits, this.uiStore.sortType) : 
        habits;
    },
    // completedHabits: only habits that are completed and NOT paused
    completedHabits() {
      return this.habits.filter(habit =>
        habit.actualProgress >= habit.dailyGoal && !habit.isPausedOnDay && habit.isScheduled
      ) || [];
    },

    // uncompletedHabits: only habits that are not completed and NOT paused
    uncompletedHabits() {
      return this.habits.filter(habit =>
        habit.actualProgress < habit.dailyGoal && !habit.isPausedOnDay && habit.isScheduled
      ) || [];
    },

    // pausedHabits
    pausedHabits() {
      return this.habits.filter(habit =>
        habit.isPausedOnDay && habit.isScheduled
      ) || [];
    },
    
    // memos for selected day
    dayMemos() {
      const dateKey = getLocalDateKey(this.selectedDay);
      const memos = this.memoStore.dayMemos[dateKey] || [];
      const sortedMemos = [...memos].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return sortedMemos;
    }
  },
  methods: {
    showDot(habit) {
      if (!habit.reminders || habit.reminders.length === 0) return false;

      const todayStart = new Date().setHours(0, 0, 0, 0);
      const todayEnd = new Date().setHours(23, 59, 59, 999);
      if (todayStart > this.selectedDay || todayEnd < this.selectedDay) return false;

      const now = new Date();

      return habit.reminders.some((time) => {
        const [hours, minutes] = time.split(":").map(Number);
        const reminderTime = new Date();
        reminderTime.setHours(hours);
        reminderTime.setMinutes(minutes);
        reminderTime.setSeconds(0);

        return reminderTime <= now && habit.actualProgress === 0;
      });
    },
    formatReminderTimes(reminderTimes) {
      return reminderTimes
        .map((time) => {
          const [hour, minute] = time.split(":").map(Number);
          const period = hour >= 12 ? "PM" : "AM";
          const hour12 = hour % 12 || 12;
          return `${hour12}:${minute.toString().padStart(2, "0")}${period}`;
        })
        .join(", ");
    },
    convertTime(time) {
      const timeParts = time.split(':');
      let hours = parseInt(timeParts[0]);
      const minutes = timeParts[1];
      let period = 'AM';

      if (hours >= 12) {
        period = 'PM';
        if (hours > 12) {
          hours -= 12;
        }
      } else if (hours === 0) {
        hours = 12;
      }

      return `${hours}:${minutes} ${period}`;
    },
    memoCategory(category) {
      if (category === 'feeling') {
        return 'How I feel today'
      } else if (category === 'gratitude') {
        return 'Words of gratitude'
      } else if (category === 'deeds') {
        return 'Good deeds today'
      } else if (category === 'highlight') {
        return 'Hightlight of the day'
      } else {
        return 'Other'
      }
    },
    toggleDeleteButton(index) {
      // Directly toggle the value in the showDeleteButton object
      this.showDeleteButton[index] = !this.showDeleteButton[index];
    },
    viewMemo(memoContent) {
      this.dialogStore.openViewMemoDialog(memoContent);
    },
    async deleteMemo(memoId, index) {
      this.showDeleteButton[index] = !this.showDeleteButton[index];
      try {
        await memoService.deleteMemo(memoId);
        // Refresh memos for the current date range
        const today = new Date();
        const startOfLastWeek = new Date(today);
        startOfLastWeek.setDate(today.getDate() - today.getDay() - 14);
        startOfLastWeek.setHours(0, 0, 0, 0);
        this.memoStore.getMemos(startOfLastWeek, today);
      } catch (error) {
        console.error("Error deleting memo:", error);
      }
    },
    toggleSection(section) {
      if (section === 'Uncompleted') {
        this.showUncompleted = !this.showUncompleted;
      } else if (section === 'Completed') {
        this.showCompleted = !this.showCompleted;
      } else if (section === 'Paused') {
        this.showPaused = !this.showPaused;
      } else if (section === 'Memos') {
        this.showMemos = !this.showMemos;
      }
    },
    handleDateSelected(date) {
      this.$store.dispatch('updateSelectedDay', date); // Update the selected day in Vuex
      this.$store.dispatch('getDayHabits', date); // Fetch day-specific progress for the selected date
      this.$store.dispatch('getDayMemos', date);
    },
    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based, so we add 1
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    },
    openDetail(habit) {
      this.$router.push({
        name: 'detail-habit',
        params: {
          habitId: habit.id,
          timestamp: this.formatDate(new Date())
        }
      });
      this.habitStore.setSelectedHabit(habit);
    },
  }
};
</script>

<style>
/* Transition for slide-fade */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* Transition for expand-collapse */
.expand-collapse-enter-active,
.expand-collapse-leave-active {
  transition: all 0.3s ease;
}

.expand-collapse-enter,
.expand-collapse-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #a78bfa;
  /* Change color as needed */
  border-radius: 50%;
  width: 32px;
  /* Spinner size */
  height: 32px;
  /* Spinner size */
  animation: spin 1s linear infinite;
}

.truncate-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  /* Limit to 2 lines */
  line-clamp: 2;
  /* Standard property for compatibility */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: pre-wrap;
  /* Allow wrapping */
  font-size: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>