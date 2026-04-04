<template>
  <div class="flex justify-center h-full">
    <router-view v-if="!uiStore.isLoading" />
    <loading v-else />
  </div>
</template>

<script>
import loading from './views/loading.vue';
import { getNotifications } from './utils/pushNotifications';
import { getAuth } from 'firebase/auth';
import { syncService } from './services/syncService';
import { useUserStore } from './store/userStore';
import { useUIStore } from './store/uiStore';
import { useHabitStore } from './store/habitStore';
import { useToastStore } from './store/toastStore';
import { onMounted } from 'vue';

export default {
  components: { loading },
  setup() {
    const uiStore = useUIStore();
    const habitStore = useHabitStore();
    const userStore = useUserStore();
    const toastStore = useToastStore();

    onMounted(async () => {
      uiStore.setLoading(true);

      try {
        await userStore.fetchUser();
        if (userStore.user) {
          getNotifications(userStore, toastStore);

          await syncService.fetchAllFromFirebase(userStore.getUserId);

          // Initialize app using Pinia store - this will only run once per session
          await habitStore.initializeApp();

          // If we're on the calendar route, fetch week progress
          // if (this.$route.name === 'calendar') {
          //   await this.$store.dispatch('fetchWeekProgress', 'thisWeek');
          // }
        }
        uiStore.setLoading(false);
      } catch (error) {
        console.error('Error in App initialization:', error);
        uiStore.setLoading(false);
      }
    });

    return {
      uiStore,
      habitStore,
      userStore,
      toastStore
    };
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
