import { defineStore } from 'pinia';
import { habitService } from '../services/habitService';
import { useUserStore } from '../store/userStore';
import { useUIStore } from './uiStore';

export const useHabitStore = defineStore('habitStore', {
  state: () => ({
    dayHabitMetrics: {},
    hasAnyHabit: false,
    selectedHabit: null
  }),
  actions: {
    // REFRESH LOGIC: Re-fetches the metrics for the current visible range
    async refreshMetrics() {
      const uiStore = useUIStore();
      const today = new Date();
      const startRange = new Date(today);
      startRange.setDate(today.getDate() - 28); // Covers the 4-week view
      await this.getHabitMetrics(startRange, today);
    },

    async getHabitMetrics(start, end) {
      const userStore = useUserStore();
      const uid = userStore.getUserId;
      this.dayHabitMetrics = { ...this.dayHabitMetrics, ...await habitService.fetchHabitMetrics(uid, start, end) };
    },

    async confirmProgress(habitId, progress, date, progressId) {
      const userStore = useUserStore();
      await habitService.updateProgress(progressId, userStore.getUserId, habitId, progress, date);
      await this.refreshMetrics(); // Sync UI
    },

    async removeProgress(habitId, date, progressId) {
      const userStore = useUserStore();
      await habitService.updateProgress(progressId, userStore.getUserId, habitId, 0, date);
      await this.refreshMetrics();
    },

    async pauseHabit(habitId) {
      await habitService.toggleHabitPause(habitId, true);
      await this.refreshMetrics();

      if (this.selectedHabit) {
        const dateKey = new Date().toISOString().split('T')[0];
        const updatedHabit = this.dayHabitMetrics[dateKey]?.find(h => h.id === habitId);
        if (updatedHabit) {
          this.selectedHabit = updatedHabit;
        }
      }
    },

    async resumeHabit(habitId) {
      await habitService.toggleHabitPause(habitId, false);
      await this.refreshMetrics();

      if (this.selectedHabit) {
        const dateKey = new Date().toISOString().split('T')[0];
        const updatedHabit = this.dayHabitMetrics[dateKey]?.find(h => h.id === habitId);
        if (updatedHabit) {
          this.selectedHabit = updatedHabit;
        }
      }
    },

    async deleteHabit(habitId) {
      await habitService.deleteHabitFull(habitId);
      this.selectedHabit = null;
      await this.checkIfAnyHabitExists();
      await this.refreshMetrics();
    },

    async addHabit(habitData) {
      const userStore = useUserStore();
      const uid = userStore.getUserId;

      // Get the index for sorting
      const habits = await habitService.fetchHabits(uid);
      const index = habits.length;

      const habitId = await habitService.addHabit({
        ...habitData,
        userId: uid,
        index,
      });

      // Refresh metrics and check if any habits exist
      await this.refreshMetrics();
      await this.checkIfAnyHabitExists();

      return habitId;
    },

    async updateHabit(habitId, habitData) {
      await habitService.updateHabitDetails(habitId, {
        ...habitData,
        syncStatus: 'pending',
        updatedAt: new Date(),
      });

      // Refresh metrics
      await this.refreshMetrics();
    },

    async checkIfAnyHabitExists() {
      const userStore = useUserStore();
      const uid = userStore.getUserId;
      this.hasAnyHabit = await habitService.checkIfAnyHabitExists(uid);
    },

    setSelectedHabit(habit) {
      this.selectedHabit = habit;
    },

    async getHabitsLength() {
      const userStore = useUserStore();
      const uid = userStore.getUserId;
      const habits = await habitService.fetchHabits(uid);
      return habits.length;
    }
  }
});