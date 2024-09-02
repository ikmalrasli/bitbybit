<template>
      <div class="w-full h-full flex flex-col bg-white">
        <!-- Header -->
        <header class="bg-white p-4 flex flex-row relative justify-between">
          <button @click="goBack" class="material-icons">chevron_left</button>
          <h1 class="text-lg text-black font-semibold">{{ habitData?.name || 'Habit Details' }}</h1>
          <span class="material-icons cursor-pointer">more_horiz</span>
        </header>
  
        <div class="flex-1 overflow-y-auto px-4">
          <div class="w-full p-4 mb-8 text-gray-700 bg-white shadow-md rounded-xl text-center">
              <h2 class="flex-auto text-xl block mb-2">Progress</h2>
              <input v-model="habitData.progress" type="number" class="w-10 text-5xl"/>
              <h2 class="flex-auto text-xl mb-2">/ {{ habitData?.target }}</h2>

              <!--add slider here
              <div class="p-4 bg-red-300 text-lg text-center h-16">Add slider here</div>-->
          </div>
  
          <div class="w-full p-4 mb-8 text-gray-700 bg-white shadow-lg rounded-xl">
            <h2 class="text-xl text-center block mb-2">Notes</h2>
            <div class="p-4 bg-green-300 text-lg text-center h-64">{{ note_image }}</div>
            <p class="text-lg p-4">{{ note_text }}</p>
          </div>
        </div>
      </div>
    
  </template>
  
  <script>
  export default {
    props: {
      habitId: {
        type: String,
        required: true
      }
    },
    data() {
      return {
        current: 1,
        target: 2,
        note_image: "Add image URL",
        note_text: "Add note text",
        habitData: null,
        allHabits: [
          { id: 'nfjakdnfk', name: "Solat Dhuha", progress: 0, target: 1 },
          { id: 'jfnkjasfk', name: "Sayyidul Istighfar", progress: 1, target: 2 },
          { id: 'fkdnsjnvj', name: "Read Quran", progress: 3, target: 5 },
        ],
      };
    },
    created() {
      this.loadHabitData();
    },
    watch: {
      habitId(newId, oldId) {
        if (newId !== oldId) {
          this.loadHabitData();
        }
      }
    },
    methods: {
      loadHabitData() {
        this.habitData = this.allHabits.find(habit => habit.id === this.habitId);
  
        if (!this.habitData) {
          console.error(`Habit with ID ${this.habitId} not found.`);
        }
      },
      goBack() {
        // Go back to the previous page
        this.$router.go(-1);
      },
    }
  }
  </script>
  