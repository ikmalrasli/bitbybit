<template>
  <div class="p-4 w-full h-full flex-grow">
    <p class="mb-4">Welcome to my test page. This is where i do my experimental content/components. Have fun!</p>
    <h1 class="text-center">User: {{ username }}</h1>
    
    <div class="border border-blue-500 p-2 rounded-lg flex space-x-2">
      <button class="flex-1 bg-green-400 text-white font-bold p-2 rounded-lg shadow-lg active:bg-green-500" 
      @click="showSuccessToast">Show Success Toast</button>
      <button class="flex-1 bg-blue-400 text-white font-bold p-2 rounded-lg shadow-lg active:bg-blue-500" 
      @click="showInfoToast">Show Info Toast</button>
      <button class="flex-1 bg-red-400 text-white font-bold p-2 rounded-lg shadow-lg active:bg-red-500" 
      @click="showErrorToast">Show Error Toast</button>
    </div>

    <habitPb
    :color="'bg-emerald-300'"
    :text="'hello world'"
    :percent="100"
    class="my-4"/>

    <button class="bg-violet-400 text-white font-bold p-2 rounded-lg shadow-lg active:bg-violet-500" @click="showConfirmationDialog">Test Dialog</button>
    <button class="mx-2 bg-blue-400 text-white font-bold p-2 rounded-lg shadow-lg active:bg-blue-500" @click="showAddMemoDialog">Add Memo</button>

    <fab/>
  
    <button @click="sendEmail" class="m-2 bg-pink-300 text-white font-bold p-2 rounded-lg shadow-lg active:bg-pink-400">
      Send Feedback
    </button>

    <button @click="updateProgressStat" class="m-2 bg-emerald-300 text-white font-bold p-2 rounded-lg shadow-lg active:bg-pink-400">
      set update progress
    </button>

    <button @click="fetchH" class="m-2 bg-orange-300 text-white font-bold p-2 rounded-lg shadow-lg active:bg-pink-400">
      fetch habits
    </button>

    <button @click="fetchWP" class="m-2 bg-orange-300 text-white font-bold p-2 rounded-lg shadow-lg active:bg-pink-400">
      fetch progress
    </button>
  </div>
</template>

<script>
import { useDialogStore } from '../../store/dialogStore';
import { useStatStore } from '../../store/statStore.js';
import habitPb from '../../components/habitpb.vue';
import RadialProgressbar from '../../components/RadialProgressbar.vue';
import fab from '../../components/fab.vue';

export default {
  components: {
    habitPb,
    RadialProgressbar,
    fab,
  },
  data() {
    return {
      statStore: useStatStore(),
      dialogStore: useDialogStore(),
      username: this.$store.state.user.displayName,
      color: { default: "bg-blue-400", active: "bg-blue-500" },
      bgColor: 'blue', // Set your default background color
      hoverColor: 'red', // Set your default hover color
    };
  },
  methods: {
    showSuccessToast() {
      this.$toast.success({
        message: 'This is a success message! Insert long message here. Insert long message here. Insert long message here.',
        duration: 1000
      });
    },
    showErrorToast() {
      this.$toast.error({
        message: 'Error. Please try again.'
      });
    },
    showInfoToast() {
      this.$toast.info({
        message: 'This is an info message!',
        duration: 5000
      });
    },
    showConfirmationDialog() {
      this.dialogStore.openDialog(
        'default',
        () => {
          // Action to perform on confirm
          console.log('Action confirmed!');
        },        
        'Confirm Action',
        'Are you sure you want to proceed with this action?',
      );
    },
    showAddMemoDialog() {
      this.dialogStore.openDialog(
        'add-memo',
        () => {
          // Action to perform on confirm
          console.log('Action confirmed!');
        }
      );
    },
    sendEmail() {
      const subject = encodeURIComponent("BitByBit User Feedback");
      const body = encodeURIComponent("Hi, here is my feedback/suggestion:");
      window.location.href = `mailto:ikmalrasli@gmail.com?subject=${subject}&body=${body}`;
    },
    updateProgressStat() {
      this.statStore.setProgressUpdated();
    },
    handleAddLink(link) {
      console.log("YouTube link added:", link);
      // Handle adding the link to your app's state or database
    },
    fetchH() {
      this.$store.dispatch('fetchHabits2');
    },
    fetchWP() {
      this.$store.dispatch('fetchWeekProgress2');
    },
  },
};
</script>