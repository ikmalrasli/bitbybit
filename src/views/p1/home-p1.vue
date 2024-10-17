<template>
  <div class="w-full flex flex-row px-4 py-2">
    <div class="flex-auto">
        <div v-if="uncompletedHabits.length===0 && completedHabits.length===0" class="w-full p-4 mb-4 text-gray-700">
          <p class="text-center">No Habits</p>
        </div>
        <!-- Collapsible Section -->
        <div class="mb-4">
          <!-- Uncompleted habits -->
          <div class="mb-4">
            <div v-if="uncompletedHabits.length !== 0" class="flex items-center justify-between cursor-pointer" @click="toggleSection('Uncompleted')">
              <div class="flex items-center">
                <span class="font-semibold text-black">Uncompleted</span>
                <span class="pl-3 text-gray-500">{{ uncompletedHabits.length }}</span>
              </div>

              <!-- Horizontal Line -->
              <hr class="flex-grow border-t border-gray-300 mx-4"/>

              <!-- Arrow -->
              <div class="flex items-center">
                <span v-if="showUncompleted" class="material-icons">keyboard_arrow_up</span>
                <span v-else class="material-icons">keyboard_arrow_down</span>
              </div>
            </div>


            <!-- Uncompleted habits List -->
            <div v-if="uncompletedHabits.length!==0" v-show="showUncompleted" class="mb-4 py-4 transition-all duration-300 ease-in-out">
              <div v-for="(habit, index) in uncompletedHabits" :key="index" class="mb-2">
                <HomeProgress 
                  :percent="habit.progress * 100 / habit.dailyGoal"
                  :text="habit.name"
                  :timesdone="habit.progress + '/' + habit.dailyGoal"
                  color="bg-violet-400"
                  class="cursor-pointer"
                  @click="openDetail(habit)"
                />
              </div>
            </div>
          </div>

          <!-- Completed habits -->
          <div v-if="completedHabits.length !== 0" class="flex items-center justify-between cursor-pointer" @click="toggleSection('Completed')">
            <div class="flex items-center">
              <span class="font-semibold text-black">Completed</span>
              <span class="pl-3 text-gray-500">{{ completedHabits.length }}</span>
            </div>

            <!-- Horizontal Line -->
            <hr class="flex-grow border-t border-gray-300 mx-4"/>

            <!-- Arrow -->
            <div class="flex items-center">
              <span v-if="showCompleted" class="material-icons">keyboard_arrow_up</span>
              <span v-else class="material-icons">keyboard_arrow_down</span>
            </div>
          </div>


          <!-- Completed habits List -->
          <div v-if="completedHabits.length!==0" v-show="showCompleted" class="py-4 transition-all duration-300 ease-in-out">
            <div v-for="(habit, index) in completedHabits" :key="index" class="mb-2">
              <HomeProgress 
                :percent="habit.progress * 100 / habit.dailyGoal"
                :text="habit.name"
                :timesdone="habit.progress + '/' + habit.dailyGoal"
                color="bg-violet-400"
                class="cursor-pointer"
                @click="openDetail(habit)"
              />
            </div>
          </div>
        
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import calendarRow from "../../components/calendar-row.vue";
import HomeProgress from "../../components/home-progressbar.vue";

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