<template>
  <div class="w-full flex flex-row p-2 sm:p-4">
    <div class="flex-auto">
      <!-- Day Selector (Responsive) -->
      <div class="flex justify-start overflow-x-auto mb-4 scrollbar-hide">
        <calendarRow @date-selected="handleDateSelected" />
      </div>

      <!-- Collapsible Section -->
      <div class="mb-4">
        <!-- Uncompleted habits -->
        <div class="mb-4">
          <div class="flex justify-between items-center cursor-pointer" @click="toggleSection('Uncompleted')">
            <span class="font-bold text-black">Uncompleted
              <span class="pl-2 font-medium text-gray-500">{{ uncompletedHabits.length }}</span>
            </span>
            <span v-if="showUncompleted" class="material-icons">keyboard_arrow_up</span>
            <span v-else class="material-icons">keyboard_arrow_down</span>
          </div>

          <!-- Uncompleted habits List -->
          <div v-show="showUncompleted" class="mb-4 py-4 transition-all duration-300 ease-in-out">
            <div v-for="(habit, index) in uncompletedHabits" :key="index" class="mb-2">
              <HomeProgress 
                :percent="habit.progress * 100 / habit.dailyGoal"
                :text="habit.name"
                :timesdone="habit.progress.toString() + '/' + habit.dailyGoal.toString()"
                color="bg-violet-400"
                class="cursor-pointer"
                @click="openDetail(habit)"
              />
            </div>
          </div>
        </div>

        <!-- Completed habits -->
        <div class="flex justify-between items-center cursor-pointer" @click="toggleSection('Completed')">
          <span class="font-bold text-black">Completed
            <span class="pl-2 font-medium text-gray-500">{{ completedHabits.length }}</span>
          </span>
          <span v-if="showCompleted" class="material-icons">keyboard_arrow_up</span>
          <span v-else class="material-icons">keyboard_arrow_down</span>
        </div>

        <!-- Completed habits List -->
        <div v-show="showCompleted" class="py-4 transition-all duration-300 ease-in-out">
          <div v-for="(habit, index) in completedHabits" :key="index" class="mb-2">
            <HomeProgress 
                :percent="habit.progress * 100 / habit.dailyGoal"
                :text="habit.name"
                :timesdone="habit.progress.toString() + '/' + habit.dailyGoal.toString()"
                color="bg-violet-400"
              />
          </div>
        </div>

        <button class="w-full bg-violet-400 text-white font-bold py-3 rounded-lg shadow-lg"
        @click="moe">Click 1</button>
      </div>
    </div>
  </div>
</template>

<script>
import calendarRow from "../../components/calendar-row.vue";
import HomeProgress from "../../components/home-progressbar.vue";
import { mapGetters, mapActions } from 'vuex';

export default {
  components: {
    calendarRow,
    HomeProgress,
  },
  data() {
    return {
      showUncompleted: true,
      showCompleted: true,
      selectedDayProg: [],
    };
  },
  computed: {
    ...mapGetters(['user', 'habits', 'weekHabits', 'getSelectedDay']),
    
    completedHabits() {
      return this.habits.filter((habit) => habit.progress >= habit.dailyGoal);
    },
    uncompletedHabits() {
      return this.habits.filter((habit) => habit.progress < habit.dailyGoal);
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
    openDetail(habit) {
      this.$router.push({
        name: 'detail-habit',
        params: { habitId: habit.id , timestamp: habit.timestamp}
      });
    },
    getDayHabits() {
      //console.log(this.weekHabits)
      this.weekHabits.forEach(habit => {
        //console.log(habit.timestamp.toDate())
        //console.log('selected day:', this.getSelectedDay)
        const dayHabits = []
        const selectStart = new Date(this.getSelectedDay)
        const selectEnd = new Date(this.getSelectedDay)
        selectStart.setHours(0, 0, 0, 0)
        selectEnd.setHours(23, 59, 59, 999)
        if (habit.timestamp.toDate() >= selectStart) {
          if (habit.timestamp.toDate() <= selectEnd) {
            dayHabits.push(habit)
          }
        }
      })
      console.log(dayHabits)
      return dayHabits
    },
  },
};
</script>
