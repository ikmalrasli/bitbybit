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
        this.$store.dispatch('fetchHabits');
      } else {
        this.$store.dispatch('updateLoading',false);
      }
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
