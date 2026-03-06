<template>
  <div class="flex justify-center h-full">
    <router-view v-if="!loadingStore.isLoading" />
    <loading v-else />
    <button @click="refreshData">Refresh</button>
  </div>
</template>

<script>
import loading from './views/loading.vue';
import { getNotifications } from './utils/pushNotifications';
import { getAuth } from 'firebase/auth';
import { syncService } from './services/syncService';
import { useUserStore } from './store/userStore';
import { useLoadingStore } from './store/loadingStore';
import { useHabitStore } from './store/habitStore';

export default {
  components: { loading },
  computed: {
    loadingStore() {
      return useLoadingStore();
    },
    habitStore() {
      return useHabitStore();
    }
  },
  async created() {
    this.loadingStore.setLoading(true);

    try {
      const userStore = useUserStore();
      await userStore.fetchUser();
      if (userStore.user) {
        getNotifications(this.$store, this.$toast);

        // await syncService.fetchAllFromFirebase(userStore.getUserId);

        await this.$store.dispatch('fetchPauses');
        
        // If we're on the calendar route, fetch week progress
        if (this.$route.name === 'calendar') {
          await this.$store.dispatch('fetchWeekProgress', 'thisWeek');
        }
      }
      this.loadingStore.setLoading(false);
    } catch (error) {
      console.error('Error in App created:', error);
      this.loadingStore.setLoading(false);
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
  },
  methods: {
    refreshData() {
      console.log('weekProgress:', this.habitStore.weekProgress);
      console.log('activeHabitsByDay:', this.habitStore.activeHabitsByDay);
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
