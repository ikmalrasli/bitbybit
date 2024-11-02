<template>
  <div class="w-full h-full flex flex-col flex">
    <!-- Header -->
    <header class="bg-white p-4 flex flex-row relative">
      <button @click="goBack" class="material-icons">chevron_left</button>
      <h1 class="text-lg text-black font-bold absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 truncate w-full max-w-xs text-center">{{ statStore.selectedStat.name }}</h1>
    </header>

    <div class="w-full p-4">
        <calendarMonth/>
    </div>
  
  </div>
</template>

<script>
import calendarMonth from '../../components/stats-calendar.vue';
import { useStatStore } from '../../store/statStore.js';

export default {
  components: {
    calendarMonth
  },
  data() {
    const statStore = useStatStore();
    return {
      statStore,
      habitId: this.$route.params.habitId
    }
  },
  methods: {
    goBack() {
      this.$router.push('/stats');
    },

  }
}
</script>

<style>

</style>