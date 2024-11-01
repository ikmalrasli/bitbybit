import { defineStore } from 'pinia';

export const useHabitStore = defineStore('habitStore', {
  state: () => ({
    selectedHabit: null,   // Holds the currently selected habit
    selectedMonth: new Date().getMonth(), // Default to the current month
    selectedYear: new Date().getFullYear(), // Default to the current year
  }),
  actions: {
    // Sets the selected habit
    openDetail(habit) {
      this.selectedHabit = habit;
    },
    // Sets the selected month and year
    setMonthAndYear(month, year) {
      this.selectedMonth = month;
      this.selectedYear = year;
    },
    // Increments the month and updates the year if necessary
    nextMonth() {
      if (this.selectedMonth === 11) {
        this.selectedMonth = 0;
        this.selectedYear++;
      } else {
        this.selectedMonth++;
      }
    },
    // Decrements the month and updates the year if necessary
    previousMonth() {
      if (this.selectedMonth === 0) {
        this.selectedMonth = 11;
        this.selectedYear--;
      } else {
        this.selectedMonth--;
      }
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
  },
});
