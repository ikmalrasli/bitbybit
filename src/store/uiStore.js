import { defineStore } from 'pinia';

export const useUIStore = defineStore('uiStore', {
  state: () => ({
    loading: false, // Start false, let the fetch/login set it to true
  }),
  getters: {
    isLoading: (state) => state.loading,
  },
  actions: {
    setLoading(value) {
      this.loading = value;
    }
  }
});