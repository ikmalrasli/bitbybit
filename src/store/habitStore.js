import { defineStore } from 'pinia';
import { habitService } from '../services/habitService';
import { useUserStore } from '../store/userStore';

export const useHabitStore = defineStore('habitStore', {
  state: () => ({
    selectedDate: new Date(),
    dayHabitMetrics: {}
  }),
  actions: {
    setSelectedDate(date) {
      this.selectedDate = date;
    },
    async getHabitMetrics(start, end) {
      const userStore = useUserStore();
      const uid = userStore.getUserId;
      this.dayHabitMetrics = { ...this.dayHabitMetrics, ...await habitService.fetchHabitMetrics(uid, start, end) };
    }

  }
});