<template>
  <div class="w-full h-full flex flex-col bg-white border-r">
    <!-- Header -->
    <header class="bg-white p-4 flex flex-row relative justify-between">
      <button @click="goBack" class="material-icons rounded-full active:bg-gray-200">chevron_left</button>
      <h1 class="text-xl text-black font-bold">{{ selectedHabit?.name || 'Habit Details' }}</h1>

      <!-- More Options Button (Dropdown Toggle) -->
      <div class="relative">
        <!-- Dropdown Toggle Button -->
        <button @click="toggleDropdown" class="material-icons rounded-full active:bg-gray-200">more_horiz</button>

        <!-- Dropdown Menu -->
        <div v-if="isDropdownOpen" class="absolute right-0 z-10 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200" @click.stop>
          <ul class="py-1 text-gray-700">
            <li @click="option1" class="grid grid-cols-[auto,1fr] items-center px-4 py-2 text-md hover:bg-gray-100 cursor-pointer">
              <span class="material-icons">edit</span>
              <span class="text-center w-full">Edit habit</span>
            </li>
            <li @click="option2" class="grid grid-cols-[auto,1fr] items-center px-4 py-2 text-md text-red-500 hover:bg-gray-100 cursor-pointer">
              <span class="material-icons">delete</span>
              <span class="text-center w-full">Delete habit</span>
            </li>
          </ul>
        </div>
      </div>
    </header>

    <div class="flex-1 overflow-y-auto px-4">
      <!-- Progress Card -->
      <div class="w-full p-8 mb-4 text-gray-700 bg-white border rounded-lg text-center">
        <h2 class="flex-auto text-xl block mb-2">Progress</h2>
        <h1 class="flex-auto text-5xl">{{ addProgress }}</h1>
        <h2 class="flex-auto text-xl mb-2">/ {{ selectedHabit?.dailyGoal }}</h2>

        <div class="w-full justify-center flex">
          <!-- Minus Button -->
          <button type="button" @click="decreaseGoal" 
          class="material-icons p-1 text-gray-700 rounded-full active:bg-gray-200">remove</button>

          <!-- Slider -->
          <input v-if="selectedHabit"
            type="range" :min="0" :max="selectedHabit.dailyGoal"
            v-model.number="addProgress"
            class="range w-1/2 mx-2"
            :class="selectedHabit.color ? replaceBgWithAccent(selectedHabit.color.default): ''" />

          <!-- Plus Button -->
          <button type="button" @click="increaseGoal" 
          class="material-icons p-1 text-gray-700 rounded-full active:bg-gray-200">add</button>
        </div>

        <!-- Reset Progress Button -->
        <button type="button" @click="removeTodayEntries" class="material-icons text-gray-700 mt-4 mr-2 p-1 rounded-full active:bg-gray-200">replay</button>
        <!-- Add Progress Button-->
        <button type="button" @click="confirmProgress" 
        class="material-icons text-violet-400 font-semibold mt-4 ml-2 p-1 rounded-full active:bg-gray-200 disabled:text-gray-400 disabled:font-normal"
        :disabled="addProgress == selectedHabit?.progress"
        >check</button>
      </div>

      <!-- Notes and Image -->
      <div v-if="selectedHabit?.imageUrl || selectedHabit?.notes" class="w-full p-4 mb-4 text-gray-700 bg-white border rounded-lg">
        <h2 class="text-xl text-center block mb-2">Notes</h2>
        <p v-if="selectedHabit?.notes" class="text-lg px-4 py-2" style="white-space: pre-wrap;">{{ selectedHabit?.notes }}</p>
        <div v-if="selectedHabit?.imageUrl">
          <img :src="selectedHabit.imageUrl" alt="Uploaded Image" class="object-cover rounded-md" />
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { db } from "../../firebase"; // Firestore instance
import { collection, query, where, getDocs, deleteDoc, Timestamp, addDoc, orderBy, doc, updateDoc } from "firebase/firestore"; // Firestore methods
import { getAuth } from "firebase/auth"; // Firebase Authentication
import { inject } from "vue";
import { mapGetters } from 'vuex';

export default {
  data() {
    return {
      addProgress: 0,
      isDropdownOpen: false,
      docId: '',
      setTimestamp: new Date(),
      onTime: true,
    };
  },
  computed: {
    ...mapState(['selectedHabit', 'selectedDay']),
    selectedHabit() {
      this.addProgress = this.$store.state.selectedHabit.progress;
      return this.$store.state.selectedHabit;
    }
  },
  methods: {
    replaceBgWithAccent(className) {
      const result = className.replace('bg-', 'accent-');
      console.log(result);
      return result;
    },
    // Back and Dropdown Functions
    toggleDropdown(event) {
      event.stopPropagation(); // Prevent the outside click listener from being triggered
      this.isDropdownOpen = !this.isDropdownOpen;

      // If the dropdown is open, add the click listener to detect clicks outside
      if (this.isDropdownOpen) {
        document.addEventListener('click', this.handleClickOutside);
      } else {
        document.removeEventListener('click', this.handleClickOutside);
      }
    },
    handleClickOutside(event) {
      const dropdown = this.$el.querySelector('.absolute');
      if (dropdown && !dropdown.contains(event.target)) {
        this.isDropdownOpen = false;  // Close dropdown
        document.removeEventListener('click', this.handleClickOutside); // Remove the event listener
      }
    },
    option1() {
      this.editHabit();
      this.isDropdownOpen = false;
      document.removeEventListener('click', this.handleClickOutside);
    },
    option2() {
      this.deleteHabit();
      this.isDropdownOpen = false;
      document.removeEventListener('click', this.handleClickOutside);
    },
    goBack() {
      setTimeout(() => {
            this.$router.push('/');
          }, 100);
    },
    // Progress Functions
    increaseGoal() {
      if (this.addProgress < this.selectedHabit.dailyGoal) {
        this.addProgress++;
      }
    },
    decreaseGoal() {
      if (this.addProgress > 0) {
        this.addProgress--;
      }
    },
    async removeTodayEntries() {
      try {
        const dayStart = new Date(this.selectedDay);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(this.selectedDay);
        dayEnd.setHours(23, 59, 59, 999);

        const habitId = this.selectedHabit.habitId;

        const q = query(
          collection(db, 'progress'),
          where('habitId', '==', habitId),
          where('timestamp', '>=', Timestamp.fromDate(dayStart)),
          where('timestamp', '<=', Timestamp.fromDate(dayEnd))
        );

        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });

        this.$store.dispatch('fetchWeekProgress');
        this.addProgress = 0;
        this.$store.state.selectedHabit.progress = 0;
        this.createProgress();
      } catch (error) {
        this.$toast.error({
          message: 'Error resetting progress. Please try again.',
          duration: 2000
        });
      }
    },
    // Habit functions
    handleSelectedHabitChange() {
      if (this.selectedDay.setHours(0, 0, 0, 0) != new Date().setHours(0, 0, 0, 0)) {
        this.setTimestamp = new Date(this.selectedDay);
        this.setTimestamp.setHours(23, 59, 59, 999);
        this.onTime = false;
      }
      this.checkProgress();
    },
    checkProgress() {
      if (this.selectedHabit.progressId !== '') {
        this.docId = this.selectedHabit.progressId;
      } else {
        this.createProgress();
      }
    },
    createProgress() {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error("User not authenticated. Please log in.");
      }
      
      const habitRef = addDoc(collection(db, "progress"), {
        habitId: this.selectedHabit.habitId,
        progress: 0,
        timestamp: this.setTimestamp,
        onTime: this.onTime
      });

      habitRef.then((docRef) => {
        this.docId = docRef.id;
      });
    },
    updateProgress() {
      if (this.docId) {
        try{
          const docRef = doc(db, 'progress', this.docId);
          updateDoc(docRef, {
            progress: this.addProgress,
            timestamp: this.setTimestamp,
            onTime: this.onTime
          });

        if (this.addProgress === this.selectedHabit.dailyGoal) {
          this.$toast.success({
            message: 'Congratulations! You have completed this habit!',
            duration: 2000
          });

          setTimeout(() => {
            this.$router.push('/');
          }, 300);
          
        } else if (this.addProgress > this.selectedHabit.progress) {
          this.$toast.info({
            message: 'Habit progress increased! Keep it up!',
            duration: 2000
          });
        }
        this.selectedHabit.progress = this.addProgress;
        } catch(error) {
          console.log(error);
        }
      }
    },
    confirmProgress() {
      if (this.addProgress > 0) {
        this.updateProgress();
      }

      if (this.addProgress === 0) {
        this.removeTodayEntries();
      }
    },
    editHabit() {
      //use addHabit layout for edit habit
      this.$router.push({ name: 'edit-habit', params: { habitId: this.selectedHabit.habitId } });
    },
    deleteHabit() {
      //confirmation to delete habit
      if (confirm('Are you sure you want to delete this habit?')) {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user){
          //delete all progress from firestore with the habit id
          const q = query(
            collection(db, 'progress'),
            where('habitId', '==', this.selectedHabit.habitId)
          );
          getDocs(q).then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
              deleteDoc(doc.ref);
            });
          });

          //delete habit from firestore
          const docRef = doc(db, "habits", this.selectedHabit.habitId);
          deleteDoc(docRef);
          this.$toast.info({
            message: 'Habit deleted successfully!',
            duration: 2000
          });

          this.$store.dispatch('fetchHabits');
          setTimeout(() => {
            this.$router.push('/');
          }, 300);
        }
      }
    },
  },
  watch: {
    selectedHabit: 'handleSelectedHabitChange'
  },
  mounted() {
    this.handleSelectedHabitChange();
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleClickOutside);
  }
};
</script>