<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center p-4 relative">
      <button @click="$router.push('/calendar')" class="material-icons text-gray-600">chevron_left</button>
      <h1 class="text-xl font-semibold absolute left-1/2 transform -translate-x-1/2">{{ formattedDate }}</h1>
    </div>

    <!-- Content -->
    <div class="h-96 flex-grow overflow-y-auto px-4 space-y-2 pb-4 scrollbar-hide w-full">
      <div class="w-full flex flex-row">
        <div v-if="loading" class="w-full flex justify-center items-center py-8">
          <div class="spinner"></div>
        </div>

        <div v-else class="flex-auto justify-center">
          <div class="mt-1 space-y-4 pb-16">
            <!-- Uncompleted Section -->
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

              <transition name="slide-fade">
                <div v-if="showUncompleted" class="py-4 space-y-1">
                  <div v-for="(habit, index) in uncompletedHabits" :key="index">
                    <HomeProgress :percent="habit.actualProgress * 100 / habit.dailyGoal" :text="habit.name"
                      :timesdone="habit.actualProgress + '/' + habit.dailyGoal"
                      :color="habit.color ? `bg-${habit.color.default}` : 'bg-violet-400'" />
                  </div>
                </div>
              </transition>
            </div>

            <!-- Paused Section -->
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
                      :color="habit.color ? `bg-${habit.color.default}` : 'bg-gray-300'" class="opacity-70"
                      :isPaused="true" @openDetail="openDetail(habit)" />
                  </div>
                </div>
              </transition>
            </div>

            <!-- Completed Section -->
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

              <transition name="slide-fade">
                <div v-if="showCompleted" class="py-4 space-y-1">
                  <div v-for="(habit, index) in completedHabits" :key="index">
                    <HomeProgress :percent="habit.actualProgress * 100 / habit.dailyGoal" :text="habit.name"
                      :timesdone="habit.actualProgress + '/' + habit.dailyGoal"
                      :color="habit.color ? `bg-${habit.color.default}` : 'bg-violet-400'" />
                  </div>
                </div>
              </transition>
            </div>

            <!-- Memos Section -->
            <div v-if="memos.length !== 0">
              <div class="flex items-center justify-between cursor-pointer" @click="toggleSection('Memos')">
                <div class="flex items-center">
                  <span class="font-semibold text-black">Memos</span>
                </div>
                <hr class="flex-grow border-t border-gray-300 mx-4" />
                <div class="flex items-center">
                  <span v-if="showMemos" class="material-icons">keyboard_arrow_up</span>
                  <span v-else class="material-icons">keyboard_arrow_down</span>
                </div>
              </div>

              <transition name="slide-fade">
                <div v-if="showMemos" class="py-4 space-y-1">
                  <div v-for="(memo, index) in memos" :key="index">
                    <div class="flex flex-col p-2 bg-white border rounded-lg shadow-sm space-y-1">
                      <div class="flex w-full p-2 flex-row justify-between">
                        <span class="truncate-text">{{ memo.memo }}</span>
                      </div>
                      <div class="flex w-full justify-end">
                        <span
                          class="text-xs text-nowrap font-medium text-black text-opacity-50 rounded-full py-0.5 px-2 bg-black bg-opacity-5">
                          {{ memoCategory(memo?.category) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import HomeProgress from '../../components/habitpb.vue';
import { useHabitStore } from '../../store/habitStore';
import { useMemoStore } from '../../store/memoStore';
import { useUIStore } from '../../store/uiStore';
import { getLocalDateKey } from '../../utils/dateHelpers';

export default {
  name: 'CalendarP2',
  components: {
    HomeProgress
  },
  props: {
    date: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      loading: true,
      showUncompleted: true,
      showCompleted: true,
      showMemos: true,
      showPaused: true,
      habitStore: useHabitStore(),
      memoStore: useMemoStore(),
      uiStore: useUIStore(),
    };
  },
  computed: {
    selectedDay() {
      return new Date(this.date);
    },

    formattedDate() {
      const date = new Date(this.date);
      return `${date.getDate()} ${date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      })} (${date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3)})`;
    },

    // Get habits for the selected day from habitStore
    dayHabits() {
      const dateKey = getLocalDateKey(this.selectedDay);
      return this.habitStore.dayHabitMetrics[dateKey] || [];
    },

    // completedHabits: only habits that are completed and NOT paused
    completedHabits() {
      return this.dayHabits.filter(habit =>
        habit.actualProgress >= habit.dailyGoal && !habit.isPausedOnDay && habit.isScheduled
      ) || [];
    },

    // uncompletedHabits: only habits that are not completed and NOT paused
    uncompletedHabits() {
      return this.dayHabits.filter(habit =>
        habit.actualProgress < habit.dailyGoal && !habit.isPausedOnDay && habit.isScheduled
      ) || [];
    },

    pausedHabits() {
      return this.dayHabits.filter(habit =>
        habit.isPausedOnDay && habit.isScheduled
      ) || [];
    },

    // Get memos for the selected day from memoStore
    memos() {
      const dateKey = getLocalDateKey(this.selectedDay);
      const memos = this.memoStore.dayMemos[dateKey] || [];
      const sortedMemos = [...memos].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return sortedMemos;
    },
  },
  methods: {
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
    memoCategory(category) {
      if (category === 'feeling') {
        return 'How I feel today'
      } else if (category === 'gratitude') {
        return 'Words of gratitude'
      } else if (category === 'deeds') {
        return 'Good deeds today'
      } else if (category === 'highlight') {
        return 'Highlight of the day'
      } else {
        return 'Other'
      }
    },
    async fetchDayData() {
      try {
        this.loading = true;
        
        // Set the selected date in UI store
        this.uiStore.selectedDate = this.selectedDay;
        
        // Calculate date range (just the selected day)
        const startDate = new Date(this.selectedDay);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(this.selectedDay);
        endDate.setHours(23, 59, 59, 999);
        
        // Fetch habits and memos for the date range
        await Promise.all([
          this.habitStore.getHabitMetrics(startDate, endDate),
          this.memoStore.getMemos(startDate, endDate)
        ]);
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        this.loading = false;
      }
    },
  },
  async mounted() {
    await this.fetchDayData();
  },
};
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #a78bfa;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  animation: spin 1s linear infinite;
}

.truncate-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: pre-wrap;
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
