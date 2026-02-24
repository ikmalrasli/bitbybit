/**
 * Utility for immediate Firestore sync when online
 */
export async function syncToFirestoreIfOnline() {
  if (navigator.onLine) {
    try {
      console.log('[Immediate Sync] Triggering immediate Firestore sync');
      const { performSync } = await import('./syncEngine');
      await performSync();
      console.log('[Immediate Sync] Immediate sync completed');
      return true;
    } catch (error) {
      console.error('[Immediate Sync] Error during immediate sync:', error);
      return false;
    }
  } else {
    console.log('[Immediate Sync] Offline - skipping immediate sync');
    return false;
  }
}

/**
 * Enhanced version that also refreshes UI after sync
 */
export async function syncAndRefreshUI() {
  const synced = await syncToFirestoreIfOnline();
  
  if (synced) {
    // Trigger UI refresh through store if available
    try {
      if (typeof window !== 'undefined' && window.__vue_devtools_global_hook) {
        const vueInstance = window.__vue_devtools_global_hook.Vue;
        if (vueInstance && vueInstance.$store) {
          const store = vueInstance.$store;
          
          // Refresh all relevant data
          await store.dispatch('fetchHabits');
          await store.dispatch('fetchWeekProgress');
          await store.dispatch('fetchWeekMemos');
          await store.dispatch('fetchPauses');
          
          console.log('[Immediate Sync] UI refreshed after sync');
        }
      }
    } catch (error) {
      console.error('[Immediate Sync] Error refreshing UI:', error);
    }
  }
  
  return synced;
}
