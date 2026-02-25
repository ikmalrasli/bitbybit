<template>
  <div class="flex justify-center h-full">
    <router-view v-if="!$store.state.loading" />
    <loading v-else />
  </div>
</template>

<script>
import loading from './views/loading.vue';
import { getNotifications } from './utils/pushNotifications';
import { getAuth } from 'firebase/auth';
import { performSync } from './utils/syncEngine';

export default {
  components: { loading },
  async created() {
    try {
      const user = await this.$store.dispatch('fetchUser');
      if (user) {
        getNotifications(this.$store, this.$toast);
        
        // Set loading to true before fetching data
        this.$store.dispatch('updateLoading', true);
        
        // Fetch habits first
        await this.$store.dispatch('fetchHabits');
        await this.$store.dispatch('fetchPauses');
        
        // If we're on the calendar route, fetch week progress
        if (this.$route.name === 'calendar') {
          await this.$store.dispatch('fetchWeekProgress', 'thisWeek');
        }
        
        // Sync immediately after fetching data, then set loading to false
        // This eliminates the extra loading cycle
        if (navigator.onLine) {
          try {
            console.log('[App] Triggering immediate sync after data fetch');
            // Use static import instead of dynamic
            await performSync();
            console.log('[App] Immediate sync completed');
          } catch (error) {
            console.error('[App] Error in immediate sync:', error);
          }
        }
        
        // Set loading to false after data fetch and sync are complete
        this.$store.dispatch('updateLoading', false);
      } else {
        this.$store.dispatch('updateLoading', false);
      }
    } catch (error) {
      console.error('Error in App created:', error);
      this.$store.dispatch('updateLoading', false);
    }
  },
  async mounted() {
    // If user is already logged in
    const auth = getAuth();
    if (auth.currentUser) {
      await this.$store.dispatch('checkForNewNews');
    }
  },
  beforeDestroy() {
    if (this.$store.state.unsubscribeHabits) {
      this.$store.state.unsubscribeHabits();
    }
  }
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
