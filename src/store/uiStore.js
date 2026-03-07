import { defineStore } from 'pinia';

export const useUIStore = defineStore('uiStore', {
  state: () => ({
    loading: false, // Start false, let the fetch/login set it to true
    selectedDate: new Date(),
  }),
  getters: {
    isLoading: (state) => state.loading,
  },
  actions: {
    setLoading(value) {
      this.loading = value;
    },
    setSelectedDate(date) {
      this.selectedDate = date;
    },
  }
});