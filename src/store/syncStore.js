// src/store/syncStore.js - Pinia store for sync UI state
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useSyncStore = defineStore('syncStore', () => {
  // State
  const isSyncing = ref(false);
  const lastSyncAt = ref(null);
  const lastError = ref(null);
  const lastResult = ref(null);
  const syncCount = ref(0);

  // Getters
  const hasSynced = computed(() => lastSyncAt.value !== null);
  const lastSyncFormatted = computed(() => {
    if (!lastSyncAt.value) return 'Never';
    const date = new Date(lastSyncAt.value);
    return date.toLocaleString();
  });
  const isHealthy = computed(() => !lastError.value || syncCount.value > 0);

  // Actions
  function setSyncing(value) {
    isSyncing.value = value;
  }

  function recordSyncStart() {
    isSyncing.value = true;
    lastError.value = null;
  }

  function recordSyncSuccess(result) {
    isSyncing.value = false;
    lastSyncAt.value = Date.now();
    lastResult.value = result;
    syncCount.value++;
    lastError.value = null;
  }

  function recordSyncError(error) {
    isSyncing.value = false;
    lastError.value = {
      message: error.message || 'Unknown error',
      timestamp: Date.now(),
    };
  }

  function reset() {
    isSyncing.value = false;
    lastSyncAt.value = null;
    lastError.value = null;
    lastResult.value = null;
    syncCount.value = 0;
  }

  return {
    // State
    isSyncing,
    lastSyncAt,
    lastError,
    lastResult,
    syncCount,
    // Getters
    hasSynced,
    lastSyncFormatted,
    isHealthy,
    // Actions
    setSyncing,
    recordSyncStart,
    recordSyncSuccess,
    recordSyncError,
    reset,
  };
});
