<!-- components/Toast.vue -->
<script setup>
import { useToastStore } from '../store/toastStore';

const toastStore = useToastStore();
</script>

<template>
  <transition name="toast-slide" mode="out-in">
    <div
      v-if="toastStore.toasts.length"
      class="z-50 fixed top-0 mx-auto md:right-0 mt-2 mb-6 md:mt-2 md:mb-2 px-2"
    >
      <transition-group name="list" tag="ul" class="flex flex-col gap-2">
        <li
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          v-show="toast.isVisible"
          :class="toastClass(toast.type)" 
          class="z-50 p-2 shadow-sm rounded-full flex items-center justify-between min-w-64 transition-all duration-200"
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
/* Transition for Toasts sliding in and out */
.toast-slide-enter-active, .toast-slide-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

/* Entry transition */
.toast-slide-enter-from, .toast-slide-leave-to {
  opacity: 0;
}

/* Mobile version (slides in from the top, slides out to the top) */
@media (max-width: 768px) {
  .toast-slide-enter-from, .toast-slide-leave-to {
    transform: translateY(-100%);
  }

  .toast-slide-enter-to, .toast-slide-leave-active {
    transform: translateY(0);
  }
}

/* Desktop version (slides in from the right, slides out to the right) */
@media (min-width: 768px) {
  .toast-slide-enter-from, .toast-slide-leave-to {
    transform: translateX(100%);
  }

  .toast-slide-enter-to, .toast-slide-leave-active {
    transform: translateX(0);
  }
}
</style>

