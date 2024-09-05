<template>
  <div class="w-full h-full flex flex-row">
    <div class="w-full h-full flex flex-col bg-white">
      <!-- Header -->
      <header class="bg-white p-4 flex flex-row relative">
        <button @click="goBack" class="material-icons">chevron_left</button>
        <h1 class="text-lg text-black font-semibold absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">{{ formData.name === '' ? 'Add Habit' : formData.name }}</h1>
      </header>

      <!-- Form Content -->
      <div class="flex-1 overflow-y-auto p-4">
        <form @submit.prevent="createEntry" class="space-y-4">
          <!-- Name -->
          <div>
            <label for="name" class="text-left block text-sm font-medium text-gray-700">Name</label>
            <input v-model="formData.name" type="text" id="name" class="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
          </div>

          <!-- Daily Goal -->
          <div>
            <label for="dailyGoal" class="text-left block text-sm font-medium text-gray-700">Daily Goal</label>
            <div class="mt-1 flex justify-center items-center space-x-2">
              <button type="button" @click="decreaseGoal" class="bg-gray-300 text-gray-700 p-2 rounded-md">-</button>
              <input v-model="formData.dailyGoal" type="number" id="dailyGoal" class="bg-white text-black w-16 p-2 border border-gray-300 rounded-md text-center"/>
              <button type="button" @click="increaseGoal" class="bg-gray-300 text-gray-700 p-2 rounded-md">+</button>
              <span>Times</span>
            </div>
          </div>

          <!-- Repeat Section -->
          <div>
            <label class="text-left block text-sm font-medium text-gray-700">Repeat</label>
            <div class="mt-2 flex space-x-2 justify-between">
              <label v-for="(day, index) in days" :key="index" class="flex items-center space-x-1">
                <input
                  type="checkbox"
                  :checked="formData.repeatDays[day]"
                  @change="toggleRepeat(day)"
                  class="form-checkbox h-4 text-indigo-600 border-gray-300 rounded"
                />
                <span class="text-sm">{{ day.charAt(0).toUpperCase() + day.slice(1) }}</span>
              </label>
            </div>
          </div>

          <!-- Reminder -->
          <div>
            <label class="text-left block text-sm font-medium text-gray-700">Reminder</label>
            <button type="button" @click="setReminder" class="mt-1 bg-gray-300 text-gray-700 p-2 rounded-md w-full">Add a reminder</button>
          </div>

          <!-- Notes -->
          <div>
            <label for="notes" class="text-left block text-sm font-medium text-gray-700">Notes</label>
            <textarea v-model="formData.notes" id="notes" class="bg-white text-black mt-1 block w-full p-2 border border-gray-300 rounded-md" placeholder="Optional"></textarea>
          </div>

          <!-- Term -->
          <div class="flex space-x-2">
            <div class="w-1/2">
              <label for="term-start" class="text-center block text-sm font-medium text-gray-700">Start</label>
              <input v-model="formData.termStart" type="date" id="term-start" class="bg-white text-black mt-1 block w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <div class="w-1/2">
              <label for="term-end" class="text-center block text-sm font-medium text-gray-700">End</label>
              <input v-model="formData.termEnd" type="date" id="term-end" class="bg-white text-black mt-1 block w-full p-2 border border-gray-300 rounded-md" placeholder="Leave empty for no end" />
            </div>
          </div>
        </form>
      </div>

      <!-- Floating Create Button -->
      <div class="sticky bottom-0 p-4">
        <button @click="createEntry" class="w-full bg-violet-400 text-white font-bold py-3 rounded-lg shadow-lg">
          Create 
        </button>
      </div>
    </div>
  </div>  
</template>

<script>
import { db } from "../../firebase"; // Firestore instance
import { collection, addDoc } from "firebase/firestore"; // Firestore methods
import { getAuth } from "firebase/auth"; // Firebase Authentication

export default {
  data() {
    return {
      formData: {
        name: "",
        dailyGoal: 1,
        repeatDays: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: true },
        reminder: null,
        notes: "",
        termStart: new Date().toISOString().split("T")[0], // Default to today
        termEnd: "",
      },
      days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    };
  },
  methods: {
    toggleRepeat(day) {
      this.formData.repeatDays[day] = !this.formData.repeatDays[day];
    },
    goBack() {
      this.$router.go(-1);
    },
    increaseGoal() {
      this.formData.dailyGoal++;
    },
    decreaseGoal() {
      if (this.formData.dailyGoal > 1) {
        this.formData.dailyGoal--;
      }
    },
    setReminder() {
      alert("Reminder feature not implemented yet!");
    },
    async createEntry() {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          throw new Error("User not authenticated. Please log in.");
        }

        // Step 1: Add the habit to the "habits" collection with userId
        const habitRef = await addDoc(collection(db, "habits"), {
          userId: user.uid, // Add userId to the document
          name: this.formData.name,
          dailyGoal: this.formData.dailyGoal,
          reminder: this.formData.reminder,
          notes: this.formData.notes,
          termStart: this.formData.termStart ? new Date(this.formData.termStart) : null,
          termEnd: this.formData.termEnd ? new Date(this.formData.termEnd) : null,
          createdAt: new Date(),
          repeat: this.formData.repeatDays,
        });

        console.log("Habit created successfully with userId:", user.uid);
        alert("Habit created successfully!");
        this.goBack(); // Navigate back after successful creation
      } catch (e) {
        console.error("Error adding document: ", e);
        alert("An error occurred while creating the habit. Please try again.");
      }
    },
  },
};
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
</style>
