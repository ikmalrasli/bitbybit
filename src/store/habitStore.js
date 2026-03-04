import { defineStore } from 'pinia';
import { habitService } from '../services/habitService';

export const useHabitStore = defineStore('habitStore', {
  state: () => ({
    dayHabits: [],
    selectedDate: new Date(),
  }),
  actions: {
    async loadDayHabits() {
      // The store just calls the service
      this.dayHabits = await habitService.getHabitsByDate(this.selectedDate);
    },
    async completeHabit(habitId) {
      await habitService.updateProgress(habitId, 100, this.selectedDate);
      await this.loadDayHabits(); // Refresh local state
    }
  }
});