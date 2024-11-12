<template>
    <div v-if="dialogStore.isVisible && dialogStore.dialogType === 'default'" 
    class="p-4 fixed inset-0 z-50 bg-gray-600 bg-opacity-50 flex items-center justify-center"
    @click.self="dialogStore.closeDialog">
      <div class="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold">{{ dialogStore.title }}</h2>
        </div>
        <div class="mb-4">
          <p v-if="dialogStore.content">{{ dialogStore.content }}</p>
        </div>
        <div class="flex justify-center space-x-3">
          <button @click="dialogStore.confirmAction" 
          class="font-bold px-4 py-2 rounded hover:bg-gray-100"
          :class="dialogStore.confirmTextClass">{{ dialogStore.confirmText }}</button>
          <button @click="dialogStore.closeDialog" class="text-gray-700 px-4 py-2 rounded hover:bg-gray-100">Cancel</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { useDialogStore } from '../store/dialogStore';
  
  export default {
    setup() {
      const dialogStore = useDialogStore();
      return { dialogStore };
    },
  };
  </script>
  