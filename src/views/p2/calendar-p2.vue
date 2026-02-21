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
                    <HomeProgress :percent="0" :text="habit.name" :timesdone="'0/' + habit.dailyGoal"
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
                    <HomeProgress :percent="habit.progress * 100 / habit.dailyGoal" :text="habit.name"
                      :timesdone="habit.progress + '/' + habit.dailyGoal"
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
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { mapState } from 'vuex';
import HomeProgress from '../../components/habitpb.vue';
import { getTotalProgressDay } from '../../utils/getTotalProgressDay';

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
      progressData: [],
      memos: [],
      loading: true,
      dayHabits: [],
      showUncompleted: true,
      showCompleted: true,
      showMemos: true,
      showPaused: true, // Add this
    };
  },
  computed: {
    ...mapState(['habits', 'user']),

    formattedDate() {
      const date = new Date(this.date);
      return `${date.getDate()} ${date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      })} (${date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3)})`;
    },

    // completedHabits: only habits that are completed and NOT paused
    completedHabits() {
      const pausedIds = this.pausedHabits.map(h => h.habitId);
      return this.dayHabits?.filter(habit =>
        habit.progress >= habit.dailyGoal && !pausedIds.includes(habit.habitId)
      ) || [];
    },

    // uncompletedHabits: only habits that are not completed and NOT paused
    uncompletedHabits() {
      const pausedIds = this.pausedHabits.map(h => h.habitId);
      return this.dayHabits?.filter(habit =>
        habit.progress < habit.dailyGoal && !pausedIds.includes(habit.habitId)
      ) || [];
    },

    pausedHabits() {
      // selectedDay should be a Date object
      const selectedDay = this.selectedDay instanceof Date ? this.selectedDay : new Date(this.selectedDay);
      selectedDay.setHours(0, 0, 0, 0);

      // Use Vuex pauses array
      return this.dayHabits.filter(habit => {
        // Find all pauses for this habit
        const pauses = this.$store.state.pauses.filter(pause => pause.habitId === habit.habitId);
        // Check if selectedDay is within any pause period
        return pauses.some(pause => {
          const start = pause.start.toDate ? pause.start.toDate() : new Date(pause.start.seconds * 1000);
          start.setHours(0, 0, 0, 0);
          const end = pause.end
            ? (pause.end.toDate ? pause.end.toDate() : new Date(pause.end.seconds * 1000))
            : null;
          if (end) {
            end.setHours(23, 59, 59, 999);
            return selectedDay >= start && selectedDay <= end;
          } else {
            // Ongoing pause, treat as paused from start date onwards
            return selectedDay >= start;
          }
        });
      });
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
    }
  },
  watch: {
    date: {
      handler: async function (newDate) {
        const startDate = new Date(newDate);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(newDate);
        endDate.setHours(23, 59, 59, 999);

        try {
          this.loading = true;

          // Calculate start of this week and last week
          const today = new Date();
          const currentDayOfWeek = today.getDay();
          const currentDate = today.getDate();

          const startOfThisWeek = new Date(today);
          startOfThisWeek.setDate(currentDate - currentDayOfWeek);
          startOfThisWeek.setHours(0, 0, 0, 0);

          const startOfLastWeek = new Date(startOfThisWeek);
          startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

          const endOfLastWeek = new Date(startOfThisWeek);
          endOfLastWeek.setHours(0, 0, 0, 0);

          let progressData = [];
          const habitIds = this.habits.map(habit => habit.habitId);
          const batchSize = 30;
          const habitBatches = [];

          for (let i = 0; i < habitIds.length; i += batchSize) {
            habitBatches.push(habitIds.slice(i, i + batchSize));
          }

          // Check if selected date is within this week or last week
          if (startDate >= startOfThisWeek) {
            console.log('using this week data')
            progressData = this.$store.state.weekProgress;
          } else if (startDate >= startOfLastWeek && startDate < endOfLastWeek) {
            // Check if we have last week's data in Vuex store
            console.log('using last week data')
            const hasLastWeekData = this.$store.state.weekProgress.some(progress => {
              const progressDate = progress.timestamp.toDate ? progress.timestamp.toDate() : new Date(progress.timestamp);
              return progressDate >= startOfLastWeek && progressDate < endOfLastWeek;
            });

            if (hasLastWeekData) {
              progressData = this.$store.state.weekProgress;
            } else {
              // Fetch data from Firestore if not in store
              for (const batchIds of habitBatches) {
                const progressQuery = query(
                  collection(db, 'progress'),
                  where('habitId', 'in', batchIds),
                  where('timestamp', '>=', startDate),
                  where('timestamp', '<=', endDate)
                );
                const progressSnapshot = await getDocs(progressQuery);
                const batchProgress = progressSnapshot.docs.map(d => ({
                  ...d.data(),
                  progressId: d.id
                }));
                progressData = [...progressData, ...batchProgress];
              }
            }
          } else {
            console.log('checking store for data outside this week and last week')
            // For dates outside this week and last week, check Vuex store first
            const hasProgressData = this.$store.state.weekProgress.some(progress => {
              const progressDate = progress.timestamp.toDate ? progress.timestamp.toDate() : new Date(progress.timestamp);
              return progressDate >= startDate && progressDate <= endDate;
            });

            if (hasProgressData) {
              console.log('hasProgressData');
              progressData = this.$store.state.weekProgress;
            } else {
              console.log('no progress data');
              for (const batchIds of habitBatches) {
                const progressQuery = query(
                  collection(db, 'progress'),
                  where('habitId', 'in', batchIds),
                  where('timestamp', '>=', startDate),
                  where('timestamp', '<=', endDate)
                );
                const progressSnapshot = await getDocs(progressQuery);
                const batchProgress = progressSnapshot.docs.map(d => ({
                  ...d.data(),
                  progressId: d.id
                }));
                this.$store.dispatch('updateWeekProgress', [...this.$store.state.weekProgress, ...batchProgress]);
                progressData = [...progressData, ...batchProgress];
              }
            }

          }


          // Process progress data
          const { endHabits } = getTotalProgressDay(startDate, progressData, this.habits, this.$store.state.pauses);
          this.dayHabits = endHabits;

          // Use Vuex store data for memos if available
          if ((startDate >= startOfThisWeek) ||
            (startDate >= startOfLastWeek && startDate < endOfLastWeek && this.$store.state.weekMemos.length > 0)) {
            this.memos = this.$store.state.weekMemos.filter(memo => {
              const memoDate = memo.timestamp.toDate ? memo.timestamp.toDate() : new Date(memo.timestamp);
              return memoDate >= startDate && memoDate <= endDate;
            });
          } else {
            // Fetch memos from Firestore if not in store
            const memosQuery = query(
              collection(db, 'memos'),
              where('userId', '==', this.user.uid),
              where('timestamp', '>=', startDate),
              where('timestamp', '<=', endDate)
            );
            const memosSnapshot = await getDocs(memosQuery);
            this.memos = memosSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          this.loading = false;
        }
      },
      immediate: true
    }
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
