<template>
  <div class="flex justify-center h-full">
    <router-view v-if="!authStore.loading" />
    <loading v-else />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import loading from './views/loading.vue';
import { useAuthStore } from './store/authStore';
import store from './store'; // Direct import of Vuex store
import { getNotifications } from './utils/pushNotifications';
import { getAuth } from 'firebase/auth';
import { performSync } from './utils/syncEngine';

const authStore = useAuthStore();

onMounted(() => {
  // Wrap async operations in an immediately invoked async function
  (async () => {
    try {
      const user = await authStore.fetchUser();
      if (user) {
        getNotifications(store, { error: (msg) => console.error(msg) }); // Simple toast fallback
        
        // Set loading to true before fetching data
        store.dispatch('updateLoading', true);
        
        // Fetch habits first
        await store.dispatch('fetchHabits');
        await store.dispatch('fetchPauses');
        
        // If we're on the calendar route, fetch week progress
        // Note: We'll need to update router access when fully migrated
        if (window.location.pathname === '/calendar') {
          await store.dispatch('fetchWeekProgress', 'thisWeek');
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
        store.dispatch('updateLoading', false);
      } else {
        store.dispatch('updateLoading', false);
      }
    } catch (error) {
      console.error('Error in App created:', error);
      store.dispatch('updateLoading', false);
    }
  })();

  // If user is already logged in
  const auth = getAuth();
  if (auth.currentUser) {
    store.dispatch('checkForNewNews');
  }
});

onBeforeUnmount(() => {
  if (store.state.unsubscribeHabits) {
    store.state.unsubscribeHabits();
  }
});
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
