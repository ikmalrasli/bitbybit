import { syncToFirestoreIfOnline } from '../utils/immediateSync';

/**
 * Mixin to add immediate Firestore sync functionality to components
 * Automatically syncs to Firestore when online after data operations
 */
export const immediateSyncMixin = {
  methods: {
    /**
     * Helper method to sync to Firestore immediately if online
     * Call this after any data operation (create, update, delete)
     */
    async immediateSync() {
      await syncToFirestoreIfOnline();
    },
    
    /**
     * Enhanced version that also refreshes specific store data
     */
    async immediateSyncWithRefresh(refreshActions = []) {
      const synced = await syncToFirestoreIfOnline();
      
      if (synced && refreshActions.length > 0) {
        try {
          for (const action of refreshActions) {
            await this.$store.dispatch(action);
          }
          console.log('[Immediate Sync] UI refreshed with actions:', refreshActions);
        } catch (error) {
          console.error('[Immediate Sync] Error refreshing UI:', error);
        }
      }
      
      return synced;
    }
  }
};

/**
 * Higher-order component that wraps a component with immediate sync functionality
 */
export function withImmediateSync(component) {
  return {
    ...component,
    methods: {
      ...component.methods,
      ...immediateSyncMixin.methods
    }
  };
}
