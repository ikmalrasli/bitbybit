<template>
  <div class="flex justify-center h-full">
    <router-view />
  </div>
</template>

<script>
export default {
  created() {
    this.$store.dispatch('fetchUser').then(() => {
      this.$store.dispatch('fetchHabits')
    })
  },
};
</script>

<style>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
</style>
