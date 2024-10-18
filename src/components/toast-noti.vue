<!-- components/Toast.vue -->
<script setup>
import { useToastStore } from '../store/toastStore';

const toastStore = useToastStore();
</script>

<template>
  <transition name="fade" mode="out-in">
    <div
      v-if="toastStore.toasts.length"
      class="fixed bottom-0 center md:right-0 w-full md:w-1/3 mb-8 md:mb-2 px-2 mx-auto"
    >
      <transition-group name="list" tag="ul" class="flex flex-col gap-2">
        <li
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          v-show="toast.isVisible"
          :class="toastClass(toast.type)" 
          class="z-10 p-4 shadow-md rounded-lg flex items-center justify-between min-w-[300px] transition-all duration-200"
        >
          <div class="flex items-center gap-2">
            <!-- Material Icons based on the type -->
            <span v-if="toast.type === 'success'" class="material-icons">check_circle</span>
            <span v-if="toast.type === 'error'" class="material-icons">error</span>
            <span v-if="toast.type === 'info'" class="material-icons">info</span>
            <span v-if="toast.type === 'warning'" class="material-icons">warning</span>

            <!-- Toast Message -->
            <div class="text-sm font-medium">{{ toast.message }}</div>
          </div>

          <!-- Close button with material icon -->
          <button class="material-icons text-gray-700 hover:text-black" @click="toastStore.hideToast(toast.id)">close</button>
        </li>
      </transition-group>
    </div>
  </transition>
</template>

<script>
function toastClass(type) {
  switch (type) {
    case 'success':
      return 'bg-green-100 border-green-400 text-green-700';
    case 'error':
      return 'bg-red-100 border-red-400 text-red-700';
    case 'info':
      return 'bg-blue-100 border-blue-400 text-blue-700';
    case 'warning':
      return 'bg-yellow-100 border-yellow-400 text-yellow-700';
    default:
      return 'bg-gray-100 border-gray-400 text-gray-700';
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 3s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
