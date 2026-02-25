/**
 * Utility for immediate Firestore sync when online
 * Note: Loading state is managed by App.vue
 */
import { performSync } from './syncEngine';

export async function syncToFirestoreIfOnline(store = null) {
  if (navigator.onLine) {
    try {
      console.log('[Immediate Sync] Triggering immediate Firestore sync');
      
      const result = await performSync();
      
      console.log('[Immediate Sync] Immediate sync completed');
      return result;
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
 * Note: Loading state is managed by App.vue
 */
export async function syncAndRefreshUI(store = null, refreshActions = []) {
  const synced = await syncToFirestoreIfOnline(store);
  
  if (synced && refreshActions.length > 0) {
    // Trigger UI refresh through store if available
    try {
      if (store) {
        for (const action of refreshActions) {
          await store.dispatch(action);
        }
        console.log('[Immediate Sync] UI refreshed with actions:', refreshActions);
      }
    } catch (error) {
      console.error('[Immediate Sync] Error refreshing UI:', error);
    }
  }
  
  return synced;
}
