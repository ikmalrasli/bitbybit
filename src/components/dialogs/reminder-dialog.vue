<template>
  <div v-if="dialogStore.isVisible && dialogStore.dialogType === 'reminder-dialog'" 
  class="p-4 fixed inset-0 z-40 bg-gray-600 bg-opacity-50 flex items-center justify-center"
  @click.self="closeDialog">
    <div class="bg-white rounded-3xl p-6 w-[320px] shadow-xl">
      <h2 class="text-lg mb-6 text-gray-700">Add a reminder</h2>
      
      <div v-for="(time, index) in reminderTimes" :key="index" class="flex items-center justify-center space-x-2 mb-4">
        <input 
          type="time" 
          v-model="reminderTimes[index]" 
          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
        />
        <button 
          v-if="index > 0" 
          @click="removeTime(index)" 
          class="text-red-500 hover:text-red-700"
        >
          <span class="material-icons text-gray-500">close</span>
        </button>
      </div>

      <div class="flex items-center justify-center mb-4">
        <button
          @click="addTime"
          class="text-blue-600 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 flex items-center"
        >
          <span class="material-icons mr-2">add</span>
          Add another time
        </button>
      </div>

      <div class="flex items-center justify-center">
        <div class="space-x-4">
          <button
            @click="closeDialog"
            class="text-gray-500 font-medium px-4 py-2 rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            @click="saveReminders"
            class="text-purple-600 font-medium px-4 py-2 rounded-lg hover:bg-purple-50"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useDialogStore } from '../../store/dialogStore';

export default {
  data() {
    return {
      dialogStore: useDialogStore(),
      reminderTimes: [''],
    }
  },
  methods: {
    addTime() {
      this.reminderTimes.push('')
    },
    removeTime(index) {
      this.reminderTimes.splice(index, 1)
    },
    saveReminders() {
      const validTimes = this.reminderTimes.filter(time => time !== '')
      if (validTimes.length > 0) {
        this.$emit('saveReminders', validTimes)
        this.closeDialog()
      } else {
        this.$toast.info({
          message: 'Please set at least one reminder time.',
          duration: 2000
        });
      }
    },
    closeDialog() {
      this.dialogStore.closeDialog();
      this.reminderTimes = [''];
    },
  }
}
</script>