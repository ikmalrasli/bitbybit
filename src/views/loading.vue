<template>
  <div class="w-full h-full fixed inset-0 flex items-center justify-center">
    <div class="flex flex-col items-center justify-center">
      <div class="font-bold text-xl text-violet-400 mb-4">BitByBit</div>
      <!--<div class="text-sm mb-2">
        Loading{{ dots }}
      </div>-->
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const dots = ref('');

// Animate the dots "loading." -> "loading.." -> "loading..."
onMounted(() => {
  let count = 0;
  const interval = setInterval(() => {
    count = (count + 1) % 4;
    dots.value = '.'.repeat(count); // Changes dots to '.', '..', '...', and resets
  }, 200); // Change the interval as needed

  // Cleanup the interval when component is unmounted
  onBeforeUnmount(() => {
    clearInterval(interval);
  });
});
</script>

<style scoped>
.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #a78bfa; /* Change color as needed */
  border-radius: 50%;
  width: 32px; /* Spinner size */
  height: 32px; /* Spinner size */
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>