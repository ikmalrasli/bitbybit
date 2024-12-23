<template>
  <div class=" w-full flex flex-row flex-grow px-4">
    <div class="flex-auto justify-center ">
      <!-- if no habits-->
      <div v-if="habits.length === 0" class="w-full p-4 mt-4 mb-4 text-gray-700">
        <p class="text-center">No Habits</p>
        <p class="text-center">
          Tap the
          <span class="inline-flex items-center mx-1">
            <span class="material-icons text-base">add</span>
          </span>
          button
        </p>
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
                <HomeProgress 
                  :percent="habit.progress * 100 / habit.dailyGoal"
                  :text="habit.name"
                  :timesdone="habit.progress + '/' + habit.dailyGoal"
                  :color="habit.color ? `bg-${habit.color.default}` : 'bg-violet-400'"
                  class="cursor-pointer"
                  :selectionMode="$store.state.selectionMode"
                  :isSelected="$store.state.selectedHabits.includes(habit.habitId)"
                  :bgColor="habit===$store.state.selectedHabit ? 'bg-gray-50' : ''"
                  :showDot="habit.reminders ? showDot(habit): false"
                  :subtext="habit.reminders ? formatReminderTimes(habit.reminders) : ''"
                  @toggleSelect="$store.dispatch('selectHabit', habit.habitId)"
                  @openDetail="openDetail(habit)"
                />
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
                <HomeProgress 
                  :percent="habit.progress * 100 / habit.dailyGoal"
                  :text="habit.name"
                  :timesdone="habit.progress + '/' + habit.dailyGoal"
                  :color="habit.color ? `bg-${habit.color.default}` : 'bg-violet-400'"
                  class="cursor-pointer"
                  @click="openDetail(habit)"
                />
              </div>
            </div>
          </transition>
        </div>

        <!-- Memos (expand/collapse) -->
        <div v-if="dayMemos.length !== 0">
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
          
          
          <!-- Memos List with Transition -->
          <transition name="slide-fade">
            <div v-if="showMemos" class="py-4 space-y-1">
              <div v-for="(memo, index) in dayMemos" :key="index">
                <div class="flex flex-col p-2 bg-white border rounded-lg shadow-sm space-y-1 cursor-pointer hover:bg-gray-50"
                    @click="viewMemo(memo)">
                  <div class="flex w-full p-2 flex-row justify-between">
                    <!-- Memo content -->
                    <span class="truncate-text">{{ memo.memo }}</span>
                  </div>
                  <div class="flex w-full justify-end">
                    <span class="text-xs text-nowrap font-medium text-black text-opacity-50 rounded-full py-0.5 px-2 bg-black bg-opacity-5">{{ memoCategory(memo?.category) }}</span>
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
import { mapState } from 'vuex';
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase"; // import your Firestore instance
import calendarRow from "../../components/calendar-row.vue";
import HomeProgress from "../../components/habitpb.vue";
import fab from "../../components/fab.vue";
import { useDialogStore } from '../../store/dialogStore';

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
      showMemos: true,
      showDeleteButton: {},
      dialogStore: useDialogStore(),
    };
  },
  computed: {
    ...mapState(['habits', 'weekHabits' ,'dayHabits', 'selectedDay', 'dayMemos', 'loadingHome']),
    completedHabits() {
      const completed = this.dayHabits.filter(habit => 
        habit.progress >= habit.dailyGoal)
      return completed
    },

    uncompletedHabits() {
      const uncompleted = this.dayHabits.filter(habit => 
        habit.progress < habit.dailyGoal)
      return uncompleted
    },
  
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

        return reminderTime <= now && habit.progress === 0;
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
        const memoRef = doc(db, "memos", memoId); // Adjust the collection name if needed
        await deleteDoc(memoRef);
        this.$store.dispatch('getDayMemos', this.selectedDay); // Refetch memos after deletion if needed
      } catch (error) {
        console.error("Error deleting memo:", error);
      }
    },
    toggleSection(section) {
      if (section === 'Uncompleted') {
        this.showUncompleted = !this.showUncompleted;
      } else if (section === 'Completed') {
        this.showCompleted = !this.showCompleted;
      } else if (section === 'Memos') {
        this.showMemos = !this.showMemos;
      }
    },
    handleDateSelected(date) {
      this.$store.dispatch('updateSelectedDay', date); // Update the selected day in Vuex
      this.$store.dispatch('getDayHabits', date); // Fetch day-specific progress for the selected date
      this.$store.dispatch('getDayMemos', date);
    },
    formatDate(date){
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based, so we add 1
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    },
    openDetail(habit) {
      this.$router.push({
        name: 'detail-habit',
        params: { 
          habitId: habit.habitId,
          timestamp: this.formatDate(new Date())
        }
      });
      this.$store.dispatch('updateSelectedHabit', habit)
    },
  }
};
</script>

<style>
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

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #a78bfa; /* Change color as needed */
  border-radius: 50%;
  width: 32px; /* Spinner size */
  height: 32px; /* Spinner size */
  animation: spin 1s linear infinite;
}

.truncate-text {
  display: -webkit-box;
  -webkit-line-clamp: 2; /* Limit to 2 lines */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: pre-wrap; /* Allow wrapping */
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