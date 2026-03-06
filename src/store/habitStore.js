import { defineStore } from 'pinia';
import { habitService } from '../services/habitService';
import { useUserStore } from '../store/userStore';

export const useHabitStore = defineStore('habitStore', {
  state: () => ({
    dayHabits: [],
    selectedDate: new Date(),
    activeHabitsByDay: {},
    weekProgress: {}
  }),
  actions: {
    async fetchWeek(start, end) {
      const userStore = useUserStore();
      const uid = userStore.getUserId;
      const { calendarMap, allProgress } = await habitService.getWeeklyData(uid, start, end);
      this.activeHabitsByDay = calendarMap; // Keyed by date "2026-03-05"
      this.weekProgress = allProgress;
    }

  }
});