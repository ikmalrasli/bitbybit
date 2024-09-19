<template>
  <div class="w-full h-full fixed inset-0 flex items-center justify-center">
    <div class="flex-col">
      <div class="w-full px-4 font-bold text-xl text-violet-400">BitByBit</div>
      <div class="w-full px-4 text-sm">
        Loading{{ dots }}
      </div>
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
  }, 500); // Change the interval as needed

  // Cleanup the interval when component is unmounted
  onBeforeUnmount(() => {
    clearInterval(interval);
  });
});
</script>

<style scoped>
/* Add any additional styles here */
</style>
