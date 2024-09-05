<template>
  <div class="w-full flex flex-row p-2 sm:p-4">
    <div class="flex-auto">
      <button @click="showHabits">hello</button>
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
                :percent="habit.progress * 100 / habit.target"
                :text="habit.name"
                :timesdone="habit.progress.toString() + '/'+ habit.target.toString() "
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
                :percent="habit.progress * 100 / habit.target"
                :text="habit.name"
                :timesdone="habit.progress.toString() + '/'+ habit.target.toString() "
                color="bg-violet-400"
              />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import calendarRow from "../../components/calendar-row.vue";
import HomeProgress from "../../components/home-progressbar.vue";

export default {
  components: {
    calendarRow,
    HomeProgress,
  },
  inject: ["setSelectedDate"], // Inject global method
  data() {
    return {
      showUncompleted: true,
      showCompleted: true,
      allHabits:[
          { id: 'nfjakdnfk', name: "Solat Dhuha", progress: 0, target: 1 },
          { id: 'jfnkjasfk', name: "Sayyidul Istighfar", progress: 1, target: 2 },
          { id: 'fkdnsjnvj', name: "Read Quran", progress: 5, target: 5 },
          { id: 'dsfvsddcc', name: "Solat Sunat Subuh", progress: 1, target: 1 },
          { id: 'sdsfacnvs', name: "Kemas katil", progress: 1, target: 1 }
      ],
      allHabits2: []
    };
  },
  computed: {
    completedHabits() {
      return this.allHabits.filter((habit) => habit.progress === habit.target);
    },
    uncompletedHabits() {
      return this.allHabits.filter((habit) => habit.progress < habit.target);
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
      this.setSelectedDate(date); // Update the global selected date
    },
    openDetail(habit) {
      this.$router.push({
        name: 'detail-habit',
        params: { habitId: habit.id }
      });
    },
    showHabits(){
      console.log(this.allHabits2)
    },
    async fetchHabitsWithValidTerm() {
      try {
        // Get today's date
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Set time to midnight for accurate comparison

        // Query the habits collection for habits that have a valid term
        const habitsRef = collection(db, "habits");
        const querySnapshot = await getDocs(habitsRef);

        const validHabits = [];
        querySnapshot.forEach((doc) => {
          const habit = doc.data();
          const termStart = habit.termStart ? habit.termStart.toDate() : null;
          const termEnd = habit.termEnd ? habit.termEnd.toDate() : null;

          // Check if today's date is within the termStart and termEnd
          const isValid = (!termEnd || termEnd >= today) && termStart <= today;

          if (isValid) {
            validHabits.push({
              id: doc.id,
              ...habit,
            });
          }
        });

        // Set the allHabits array to the valid habits
        this.allHabits2 = validHabits;

      } catch (e) {
        console.error("Error fetching habits: ", e);
      }
    }
  },
  mounted() {
    this.fetchHabitsWithValidTerm(); // Fetch habits when the component mounts
  }
};
</script>
