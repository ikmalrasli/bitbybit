<template>
  <div class="w-full h-full flex flex-col bg-white border-r">
    <!-- Header -->
    <header class="bg-white p-4 flex flex-row relative justify-between">
      <button @click="goBack" class="material-icons">chevron_left</button>
      <h1 class="text-lg text-black font-semibold">{{ selectedHabit?.name || 'Habit Details' }}</h1>
      <button @click="createEntry" class="material-icons disabled:opacity-50" :disabled="addProgress === selectedHabit.progress">check</button>
    </header>

    <div class="flex-1 overflow-y-auto px-4">
      <div class="w-full p-4 mb-4 text-gray-700 bg-white border rounded-lg text-center">
        <h2 class="flex-auto text-xl block mb-2">Progress</h2>
        <h1 class="flex-auto text-5xl">{{ addProgress }}</h1>

        <h2 class="flex-auto text-xl mb-2">/ {{ selectedHabit?.dailyGoal }}</h2>
        <!-- Minus Button -->
        <button type="button" @click="decreaseGoal" class="bg-gray-300 text-gray-700 min-w-8 min-h-8 rounded-md">-</button>

        <!-- Slider -->
        <input v-if="selectedHabit" 
          type="range" :min="0" :max="selectedHabit.dailyGoal" 
          v-model="addProgress"
          class="range accent-violet-400 w-2/5 mx-2" />

        <!-- Plus Button -->
        <button type="button" @click="increaseGoal" class="bg-gray-300 text-gray-700 min-w-8 min-h-8 rounded-md">+</button>
      </div>

      <div v-if="selectedHabit?.imageUrl || selectedHabit?.notes" class="w-full p-4 mb-4 text-gray-700 bg-white border rounded-lg">
        <h2 class="text-xl text-center block mb-2">Notes</h2>
        <p v-if="selectedHabit?.notes" class="text-lg px-4 py-2">{{ selectedHabit?.notes }}</p>

        <!-- Display the uploaded image -->
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
import { collection, addDoc } from "firebase/firestore"; // Firestore methods
import { getAuth } from "firebase/auth"; // Firebase Authentication

export default {
  props: {
    habitId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      addProgress: 0,
    };
  },
  computed: {
    ...mapState(['selectedHabit']),
    // If selectedHabit changes, reset addProgress
    selectedHabit() {
      this.addProgress = this.$store.state.selectedHabit.progress;
      return this.$store.state.selectedHabit;
    }
  },
  watch: {
    addProgress(newVal) {
      if (newVal < this.selectedHabit.progress) {
        this.addProgress = this.selectedHabit.progress;
      }
    }
  },  
  methods: {
    goBack() {
      this.$router.push('/');
    },
    increaseGoal() {
      if (this.addProgress < this.selectedHabit.dailyGoal) {
        this.addProgress++;
      }
    },
    decreaseGoal() {
      if (this.addProgress > this.selectedHabit.progress) {
        this.addProgress--;
      }
    },
    async createEntry() {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          throw new Error("User not authenticated. Please log in.");
        }

        if (this.addProgress <= this.selectedHabit.progress) {
          throw new Error("New progress cannot be less than current progress."); 
        }

        const habitRef = await addDoc(collection(db, "progress"), {
          habitId: this.selectedHabit.habitId,
          progress: Number(this.addProgress),
          timestamp: new Date(),
        });

        console.log("Progress created successfully! Habit name:", this.selectedHabit.name);
        alert("Progress created successfully!");
        this.goBack(); // Navigate back after successful creation
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    }
  }
}
</script>
