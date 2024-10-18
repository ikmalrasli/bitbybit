<template>
  <div class="p-4 w-full">
    <h1 class="text-center">User: {{ username }}</h1>
    <div class="my-4 border p-4 text-center">
    <p>Count: {{ counterStore.count }}</p>
    <p>Double Count: {{ counterStore.doubleCount }}</p>
    <button class="bg-violet-400 text-white font-bold p-2 rounded-lg shadow-lg active:bg-violet-500" 
      @click="counterStore.increment">Increase counter</button>
    </div>
    
    <div class="border border-blue-500 p-2 rounded-lg flex space-x-2">
      <button class="flex-1 bg-green-400 text-white font-bold p-2 rounded-lg shadow-lg active:bg-green-500" 
      @click="showSuccessToast">Show Success Toast</button>
      <button class="flex-1 bg-red-400 text-white font-bold p-2 rounded-lg shadow-lg active:bg-red-500" 
      @click="showErrorToast">Show Error Toast</button>
    </div>
  </div>
</template>

<script>
import { useCounterStore } from '../../store/counterStore';

export default {
  data() {
    return {
      counterStore: useCounterStore(), // Access the store directly
      username: this.$store.state.user.displayName,
    };
  },
  methods: {
    showSuccessToast() {
      this.$toast.success({
        message: 'This is a success message!',
        duration: 1000
      });
    },
    showErrorToast() {
      this.$toast.error({
        message: 'This is an error message!'
      });
    },
  },
};
</script>