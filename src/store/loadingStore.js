import { defineStore } from 'pinia';

export const useLoadingStore = defineStore('loadingStore', {
  state: () => ({
    loading: false, // Start false, let the fetch/login set it to true
  }),
  actions: {
    setLoading(value) {
      this.loading = value;
    }
  }
});