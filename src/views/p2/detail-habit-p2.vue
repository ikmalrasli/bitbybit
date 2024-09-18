<template>
    <div class="w-full h-full flex flex-col bg-white border-r">
      <!-- Header -->
      <header class="bg-white p-4 flex flex-row relative justify-between">
        <button @click="goBack" class="material-icons">chevron_left</button>
        <h1 class="text-lg text-black font-semibold">{{ selectedHabit?.name || 'Habit Details' }}</h1>
        <button class="material-icons">check</button>
      </header>

      <div class="flex-1 overflow-y-auto px-4">
        <div class="w-full p-4 mb-8 text-gray-700 bg-white shadow-md rounded-xl text-center">
            <h2 class="flex-auto text-xl block mb-2">Progress</h2>
            <h1 class="flex-auto text-5xl">{{ selectedHabit?.progress }}</h1>
            
            <h2 class="flex-auto text-xl mb-2">/ {{ selectedHabit?.dailyGoal }}</h2>
            <input v-if="selectedHabit" 
            type="range" :min="0" :max="selectedHabit.dailyGoal" 
            v-model="selectedHabit.progress"
            class="range accent-violet-400 w-2/5" >
            
        </div>

        <div class="w-full p-4 mb-8 text-gray-700 bg-white shadow-lg rounded-xl">
          <h2 class="text-xl text-center block mb-2">Notes</h2>
          <div class="p-4 bg-green-300 text-lg text-center h-64">Add image here</div>
          <p class="text-lg p-4">{{ selectedHabit?.notes }}</p>
        </div>
      </div>
    </div>
  
</template>
  
<script>
import { mapState } from 'vuex';
export default {
  props: {
    habitId: {
      type: String,
      required: true
    }
  },
  computed: {
    ...mapState(['selectedHabit']),
  },
  methods: {
    goBack() {
      this.$router.push('/');
    },
  }
}
</script>
  