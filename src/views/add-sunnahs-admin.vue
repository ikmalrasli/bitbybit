<template>
    <div class="w-full h-full flex flex-row">
      <div class="w-full h-full flex flex-col bg-white">
        <!-- Header -->
        <header class="bg-white p-4 flex flex-row relative">
          <button @click="goBack" class="material-icons">chevron_left</button>
          <h1 class="text-lg text-black font-semibold absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">Add Sunnah</h1>
        </header>
  
        <!-- Form Content -->
        <div class="flex-1 overflow-y-auto p-4">
          <form @submit.prevent="createEntry" class="space-y-4">
            <!-- Name -->
            <div>
              <label for="name" class="text-left block text-sm font-medium text-gray-700">Name</label>
              <input v-model="formData.name" type="text" id="name" class="mt-1 block w-full p-2 border border-gray-300 rounded-md" autocomplete="off" />
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
            
            <!-- Description -->
            <div>
              <label for="notes" class="text-left block text-sm font-medium text-gray-700">Description</label>
              <textarea v-model="formData.description" id="notes" class="bg-white text-black mt-1 block w-full p-2 border border-gray-300 rounded-md min-h-16" placeholder="Optional"></textarea>
            </div>
            
            <!-- Reference URL -->
            <div>
              <label for="name" class="text-left block text-sm font-medium text-gray-700">Reference URL</label>
              <input v-model="formData.refUrl" type="text" id="name" class="mt-1 block w-full p-2 border border-gray-300 rounded-md" autocomplete="off" />
            </div>
          </form>
        </div>
  
        <!-- Floating Create Button -->
        <div class="sticky bottom-0 p-4">
          <button @click="createEntry" class="min-h-12 w-full bg-violet-400 text-white font-bold py-3 rounded-lg shadow-lg">
            {{ buttonText }} 
          </button>
        </div>
      </div>
    </div>  
  </template>
  
  <script>
  import { db } from "../firebase"; // Firestore instance
  import { collection, addDoc } from "firebase/firestore"; // Firestore methods
  import { getAuth } from "firebase/auth"; // Firebase Authentication
  
  export default {
    data() {
      return {
        formData: {
          name: "",
          dailyGoal: 1,
          repeatDays: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: true },
          description: "",
          refUrl: "",
        },
        days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
        isLoading: false, // Loading state for the button
        loadingText: 'Create', // Initial button text
      };
    },
    computed: {
      buttonText() {
        return this.isLoading ? this.loadingText : 'Create'; // Toggle text based on loading state
      }
    },
    methods: {
      toggleRepeat(day) {
        this.formData.repeatDays[day] = !this.formData.repeatDays[day];
      },
      goBack() {
        this.$router.push('/');
      },
      increaseGoal() {
        this.formData.dailyGoal++;
      },
      decreaseGoal() {
        if (this.formData.dailyGoal > 1) {
          this.formData.dailyGoal--;
        }
      },
      async createEntry() {
        try {
          this.isLoading = true; // Set loading state to true
          this.startLoadingDots();
  
          const auth = getAuth();
          const user = auth.currentUser;
  
          if (!user) {
            throw new Error("User not authenticated. Please log in.");
          }
  
          // Step 1: Add the habit to the "habits" collection with userId and image URL
          const habitRef = await addDoc(collection(db, "sunnahs"), {
            name: this.formData.name,
            dailyGoal: this.formData.dailyGoal,
            repeat: this.formData.repeatDays,
            description: this.formData.description,
            refUrl: this.formData.refUrl,
          });
  
          console.log("Sunnah created successfully with userId:", user.uid);
          alert("Sunnah created successfully!");
        } catch (error) {
          console.error("Error creating habit:", error);
          alert("Error creating habit: " + error.message);
        } finally {
          this.isLoading = false; // Reset loading state
          this.loadingText = 'Create'; // Reset button text
          this.name='';
          this.dailyGoal=1;
          this.repeatDays={ mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: true };
          this.description='';
          this.refUrl='';
        }
      },
      startLoadingDots() {
        let dotCount = 1;
        const loadingInterval = setInterval(() => {
          dotCount = (dotCount + 1) % 4; // Loop between 0 and 3
          this.loadingText = '.'.repeat(dotCount); // Update loading text with dots
  
          if (!this.isLoading) {
            clearInterval(loadingInterval); // Stop interval if not loading
          }
        }, 250); // Update every 250 ms
      },
    },
  };
  </script>
  
  <style scoped>
  
  </style>
  