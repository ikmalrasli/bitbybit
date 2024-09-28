<template>
  <div class="w-full flex flex-row p-4">
    <div class="flex-auto">
      <!-- Day Selector (Responsive) -->
      <div class="flex justify-start overflow-x-auto mb-4 scrollbar-hide">
        <calendarRow @date-selected="handleDateSelected" />
      </div>

      <!-- Collapsible Section -->
      <div class="mb-4">
        <!-- Uncompleted habits -->
        <div class="mb-4">
          <div v-if="uncompletedHabits.length!==0" class="flex justify-between items-center cursor-pointer" @click="toggleSection('Uncompleted')">
            <span class="font-bold text-black">Uncompleted
              <span class="pl-2 font-medium text-gray-500">{{ uncompletedHabits.length }}</span>
            </span>
            <span v-if="showUncompleted" class="material-icons">keyboard_arrow_up</span>
            <span v-else class="material-icons">keyboard_arrow_down</span>
          </div>

          <!-- Uncompleted habits List -->
          <div v-if="uncompletedHabits.length!==0" v-show="showUncompleted" class="mb-4 py-4 transition-all duration-300 ease-in-out">
            <div v-for="(habit, index) in uncompletedHabits" :key="index" class="mb-2">
              <HomeProgress 
                :percent="habit.progress * 100 / habit.dailyGoal"
                :text="habit.name+'-'+habit.habitId"
                :timesdone="habit.progress + '/' + habit.dailyGoal"
                color="bg-violet-400"
                class="cursor-pointer"
                @click="openDetail(habit)"
              />
            </div>
          </div>
        </div>

        <!-- Completed habits -->
        <div v-if="completedHabits.length!==0" class="flex justify-between items-center cursor-pointer" @click="toggleSection('Completed')">
          <span class="font-bold text-black">Completed
            <span class="pl-2 font-medium text-gray-500">{{ completedHabits.length }}</span>
          </span>
          <span v-if="showCompleted" class="material-icons">keyboard_arrow_up</span>
          <span v-else class="material-icons">keyboard_arrow_down</span>
        </div>

        <!-- Completed habits List -->
        <div v-if="completedHabits.length!==0" v-show="showCompleted" class="py-4 transition-all duration-300 ease-in-out">
          <div v-for="(habit, index) in completedHabits" :key="index" class="mb-2">
            <HomeProgress 
              :percent="habit.progress * 100 / habit.dailyGoal"
              :text="habit.name+'-'+habit.habitId"
              :timesdone="habit.progress + '/' + habit.dailyGoal"
              color="bg-violet-400"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
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
    ...mapState(['habits', 'weekHabits' ,'dayHabits']),
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
      //console.log(habit)
      this.$router.push({
        name: 'detail-habit',
        params: { 
          habitId: habit.habitId,
          timestamp: this.formatDate(new Date())
        }
      });
      this.$store.dispatch('updateSelectedHabit', habit)
    },
    check(){
      console.log(this.unc)
    }
  }
};
</script>
