<template>
  <div class="flex justify-center h-full">
    <router-view v-if="!$store.state.loading" />
    <loading v-else />
  </div>
</template>

<script>
import loading from './views/loading.vue';

export default {
  components: { loading },
  created() {
    this.$store.dispatch('fetchUser').then((user) => {
      if (user) {
        if (this.$store.state.habits.length === 0) {
          this.$store.commit('setFirstFetchHabits', true);
          this.$store.dispatch('fetchHabits');
        } else {
          if (this.$store.state.weekProgress.length === 0) {
            this.$store.dispatch('fetchWeekProgress');
          } else {
            //console.log('App.vue')
            //this.$store.dispatch('getDayHabits', this.$store.state.selectedDay, false);
          }
          
          if (this.$store.state.weekMemos.length === 0) {
            this.$store.dispatch('fetchWeekMemos');
          } else {
            this.$store.dispatch('getDayMemos', this.$store.state.selectedDay);
          }
        }
      } else {
        this.$store.dispatch('updateLoading',false);
      }
    });
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
