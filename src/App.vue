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
import { syncEngine } from './services/syncEngine';
import { useUserStore } from './store/userStore';
import { useUIStore } from './store/uiStore';
import { useHabitStore } from './store/habitStore';
import { useToastStore } from './store/toastStore';
import { useSyncStore } from './store/syncStore';
import { onMounted } from 'vue';

export default {
  components: { loading },
  setup() {
    const uiStore = useUIStore();
    const habitStore = useHabitStore();
    const userStore = useUserStore();
    const toastStore = useToastStore();
    const syncStore = useSyncStore();

    onMounted(async () => {
      uiStore.setLoading(true);

      try {
        await userStore.fetchUser();
        // Double-check authentication with Firebase Auth directly
        const auth = getAuth();
        console.log('App.vue: Auth state check - userStore.user:', !!userStore.user, 'auth.currentUser:', !!auth.currentUser);
        
        if (userStore.user && auth.currentUser) {
          console.log('App.vue: User is authenticated, verifying user exists in database...');
          
          // Verify user actually exists in our database before proceeding
          try {
            const { getFirestore, doc, getDoc } = await import('firebase/firestore');
            const db = getFirestore();
            const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
            
            if (userDoc.exists()) {
              console.log('App.vue: User verified in database, starting sync...');
              getNotifications(userStore, toastStore);

              // Sync engine: initial pull if cursor is 0, else incremental sync
              const uid = userStore.getUserId;
              syncStore.recordSyncStart();
              try {
                const cursor = await syncEngine.getCursor(uid);
                let result;
                if (cursor === 0) {
                  // First sync: pull all data from Firestore
                  console.log('🔄 First sync: pulling all data from Firestore...');
                  result = await syncEngine.pullAllForUser(uid);
                } else {
                  // Incremental sync: push dirty, then pull updates
                  console.log('🔄 Incremental sync...');
                  result = await syncEngine.sync(uid);
                }
                syncStore.recordSyncSuccess(result);
                console.log('✅ Sync complete:', result);
              } catch (syncError) {
                syncStore.recordSyncError(syncError);
                console.error('❌ Sync failed:', syncError);
                // Don't block app initialization on sync error
              }

              // Initialize app using Pinia store - this will only run once per session
              await habitStore.initializeApp();

              // If we're on the calendar route, fetch week progress
              // if (this.$route.name === 'calendar') {
              //   await this.$store.dispatch('fetchWeekProgress', 'thisWeek');
              // }
            } else {
              console.log('App.vue: User not found in database, skipping sync');
              // Clear the invalid user session
              await userStore.logout();
            }
          } catch (dbError) {
            console.error('App.vue: Error checking user in database:', dbError);
          }
        } else {
          console.log('App.vue: User not authenticated, skipping sync');
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
      toastStore,
      syncStore
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
