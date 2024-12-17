import { defineStore } from 'pinia';

export const useStatStore = defineStore('habitStore', {
  state: () => ({
    selectedStat: null,   // Holds the currently selected habit
    selectedMonth: new Date().getMonth(), // Default to the current month
    selectedYear: new Date().getFullYear(), // Default to the current year
    textColor: 'text-violet-400',
    fillColor: 'fill-violet-400',
    habitsCache: {}, // Caches habits data by month and year
    progressUpdated: true,
  }),
  actions: {
    resetHabitsCache() {
      this.habitsCache = {};
    },
    // Sets the selected habit
    selectStat(habit) {
      this.selectedStat = habit;
      if (habit.color) {
        this.textColor = 'text-' + habit.color.default;
        this.fillColor = 'fill-' + habit.color.default;
      }
    },
    // Sets the selected month and year
    setMonthAndYear(month, year) {
      this.selectedMonth = month;
      this.selectedYear = year;
    },
    // Stores habits for the specified month and year in cache
    setHabitsForMonth(habits, month, year) {
      const key = `${month}-${year}`;
      this.habitsCache[key] = habits;
    },
    // Retrieves habits for the specified month and year from cache
    getHabitsForMonth(month, year) {
      const key = `${month}-${year}`;
      return this.habitsCache[key] || null;
    },
    setProgressUpdated() {
      this.progressUpdated = true;
    },
    resetProgressUpdated() {
      this.progressUpdated = false;
    },
  },
  getters: {
    // Returns the name of the selected month
    currentMonthName: (state) => {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ];
      return monthNames[state.selectedMonth];
    },
    getHabitId: (state) => state.selectedHabit,
  },
});
