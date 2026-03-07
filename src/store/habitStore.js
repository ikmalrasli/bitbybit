import { defineStore } from 'pinia';
import { habitService } from '../services/habitService';
import { useUserStore } from '../store/userStore';

export const useHabitStore = defineStore('habitStore', {
  state: () => ({
    dayHabitMetrics: {},
    hasAnyHabit: false
  }),
  actions: {
    async getHabitMetrics(start, end) {
      const userStore = useUserStore();
      const uid = userStore.getUserId;
      this.dayHabitMetrics = { ...this.dayHabitMetrics, ...await habitService.fetchHabitMetrics(uid, start, end) };
    },
    async checkIfAnyHabitExists() {
      const userStore = useUserStore();
      const uid = userStore.getUserId;
      this.hasAnyHabit = await habitService.checkIfAnyHabitExists(uid);
    }
  }
});