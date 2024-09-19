<template>
  <div class="flex justify-center h-full">
    <router-view v-if="!$store.state.loading" />
    <loading v-else />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import loading from './views/loading.vue';

export default {
  components: { loading },
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
