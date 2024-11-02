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

    <habitPb
    :color="'bg-green-300'"
    :text="'hello world'"
    :percent="100"
    class="my-4"/>

    <habitPb
    :color="'bg-emerald-300'"
    :text="'hello world'"
    :percent="100"
    class="my-4"/>
  </div>
</template>

<script>
import { useCounterStore } from '../../store/counterStore';
import { useStatStore } from '../../store/statStore';
import habitPb from '../../components/habitpb.vue';

export default {
  components: {
    habitPb
  },
  data() {
    return {
      counterStore: useCounterStore(), // Access the store directly
      username: this.$store.state.user.displayName,
      color: { default: "bg-blue-400", active: "bg-blue-500" },
      bgColor: 'blue', // Set your default background color
      hoverColor: 'red', // Set your default hover color
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