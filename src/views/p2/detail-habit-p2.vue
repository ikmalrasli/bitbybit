<template>
    <div class="w-full h-full flex flex-col bg-white border-r">
      <!-- Header -->
      <header class="bg-white p-4 flex flex-row relative justify-between">
        <button @click="goBack" class="material-icons">chevron_left</button>
        <h1 class="text-lg text-black font-semibold">{{ selectedHabit?.name || 'Habit Details' }}</h1>
        <button @click="createEntry" class="material-icons">check</button>
      </header>

      <div class="flex-1 overflow-y-auto px-4">
        <div class="w-full p-4 mb-8 text-gray-700 bg-white shadow-md rounded-xl text-center">
            <h2 class="flex-auto text-xl block mb-2">Progress</h2>
            <h1 class="flex-auto text-5xl">{{ addProgress }}</h1>
            
            <h2 class="flex-auto text-xl mb-2">/ {{ selectedHabit?.dailyGoal }}</h2>
            <input v-if="selectedHabit" 
            type="range" :min="0" :max="selectedHabit.dailyGoal" 
            v-model="addProgress"
            class="range accent-violet-400 w-2/5" >
            
        </div>

        <div class="w-full p-4 mb-4 text-gray-700 bg-white shadow-lg rounded-xl">
          <h2 class="text-xl text-center block">Notes</h2>          
          <p class="text-lg px-4 py-2">{{ selectedHabit?.notes }}</p>
          <div class="px-4 py-2 bg-green-300 text-lg text-center h-64 rounded-md">Add image here</div>
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
      addProgress : 0,
    };
  },
  computed: {
    ...mapState(['selectedHabit']),
  },
  methods: {
    goBack() {
      this.$router.push('/');
    },
    async createEntry() {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          throw new Error("User not authenticated. Please log in.");
        }

        if (this.addProgress <= this.selectedHabit.progress){
          alert("New progress cannot be less than current progress.");
          throw new Error("New progress cannot be less than current progress."); 
        }

        const habitRef = await addDoc(collection(db, "progress"), {
          habitId : this.selectedHabit.habitId,
          progress : Number(this.addProgress),
          timestamp : new Date(),
        });

        console.log("Progress created successfully! Habit name:", this.selectedHabit.name);
        alert("Progress created successfully!");
        this.goBack(); // Navigate back after successful creation
      } catch (e) {
        console.error("Error adding document: ", e);
        alert("An error occurred while creating the progress. Please try again.");
      }
    }
  }
}
</script>
  