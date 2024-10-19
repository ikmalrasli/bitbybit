<template>
  <div class="w-full flex flex-row px-4 py-2">
    <div class="flex-auto">
      <!-- if no habits-->
      <div v-if="uncompletedHabits.length === 0 && completedHabits.length === 0" class="w-full p-4 mb-4 text-gray-700">
        <p class="text-center">No Habits</p>
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
          <transition name="slide-fade" appear>
            <div v-if="showUncompleted" class="py-4 space-y-1">
              <div v-for="(habit, index) in uncompletedHabits" :key="index">
                <HomeProgress 
                  :percent="habit.progress * 100 / habit.dailyGoal"
                  :text="habit.name"
                  :timesdone="habit.progress + '/' + habit.dailyGoal"
                  :color="habit.color ? getBgColor(habit.color) : 'bg-violet-400'"
                  class="cursor-pointer"
                  @click="openDetail(habit)"
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
          <transition name="slide-fade" appear>
            <div v-if="showCompleted" class="py-4">
              <div v-for="(habit, index) in completedHabits" :key="index" class="mb-2">
                <HomeProgress 
                  :percent="habit.progress * 100 / habit.dailyGoal"
                  :text="habit.name"
                  :timesdone="habit.progress + '/' + habit.dailyGoal"
                  :color="habit.color ? getBgColor(habit.color) : 'bg-violet-400'"
                  class="cursor-pointer"
                  @click="openDetail(habit)"
                />
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
import calendarRow from "../../components/calendar-row.vue";
import HomeProgress from "../../components/home-progressbar.vue";
import { getBgColor, getActiveColor } from '../../utils/getColor';

export default {
  components: {
    calendarRow,
    HomeProgress,
  },
  data() {
    return {
      showUncompleted: true,
      showCompleted: true,
    };
  },
  computed: {
    ...mapState(['habits', 'weekHabits' ,'dayHabits', 'selectedDay']),
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
    getBgColor, getActiveColor,
    toggleSection(section) {
      if (section === 'Uncompleted') {
        this.showUncompleted = !this.showUncompleted;
      } else if (section === 'Completed') {
        this.showCompleted = !this.showCompleted;
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
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter, .slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>