<template>
  <div class=" w-full flex flex-row px-4 pb-24">
    <div class="flex-auto">
      <!-- if no habits-->
      <div v-if="uncompletedHabits.length === 0 && completedHabits.length === 0" class="w-full p-4 mt-4 mb-4 text-gray-700">
        <p class="text-center">No Habits</p>
        <p class="text-center">
          Tap the
          <span class="inline-flex items-center mx-1">
            <span class="material-icons text-base">add</span>
          </span>
          button
        </p>
      </div>

      <!-- Collapsible Section -->
      <div class="mt-1 space-y-4">
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
                <div class="flex flex-col p-2 bg-white border rounded-lg shadow-sm overflow-x-auto space-y-1"
                     @click="toggleDeleteButton(index)">
                  <div class="flex w-full p-2 flex-row justify-between">
                    <!-- Memo content -->
                    <span>{{ memo.memo }}</span>
                    <!-- Delete button -->
                    <button v-if="showDeleteButton[index]" 
                            class="rounded-lg text-red-300 material-icons"
                            @click.stop="deleteMemo(memo.memoId, index)">
                      delete
                    </button>
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
      showDeleteButton: {}
    };
  },
  computed: {
    ...mapState(['habits', 'weekHabits' ,'dayHabits', 'selectedDay', 'dayMemos']),
    completedHabits() {
      const completed = this.dayHabits.filter(habit => 
        habit.progress >= habit.dailyGoal)
      return completed
    },

    uncompletedHabits() {
      const uncompleted = this.dayHabits.filter(habit => 
        habit.progress < habit.dailyGoal)
      return uncompleted
    }
  },
  methods: {
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
</style>