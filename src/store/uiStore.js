import { defineStore } from 'pinia';

export const useUIStore = defineStore('uiStore', {
  state: () => ({
    loading: false, // Start false, let the fetch/login set it to true
    selectedDate: new Date(),
    sortType: localStorage.getItem('habit-home-sortType') || 'name', // Default sort type with persistence
    selectedHabits: [],
    selectionMode: false,
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
    setSortType(type) {
      this.sortType = type;
      localStorage.setItem('habit-home-sortType', type);
    },
    toggleSelectionMode() {
      this.selectionMode = !this.selectionMode;
      if (!this.selectionMode) this.selectedHabits = [];
    },
    selectHabit(habitId) {
      console.log('selectHabit', habitId);
      if (this.selectedHabits.includes(habitId)) {
        this.selectedHabits = this.selectedHabits.filter(id => id !== habitId); // Deselect habit
      } else {
        this.selectedHabits.push(habitId);
      }
    },
  }
});