import { defineStore } from 'pinia';
import { habitService } from '../services/habitService';
import { useUserStore } from '../store/userStore';
import { useUIStore } from './uiStore';
import { usePhotoCacheStore } from './photoCacheStore';

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
      const userStore = useUserStore();
      const today = new Date();
      const startRange = new Date(today);
      startRange.setDate(today.getDate() - 28); // Covers the 4-week view
      
      // Use fetchHabitsWithMigration for automatic photo migration
      await this.getHabitMetrics(startRange, today, { enableMigration: true });
    },

    async getHabitMetrics(start, end, options = {}) {
      const userStore = useUserStore();
      const uid = userStore.getUserId;
      
      // Pass migration options to habitService
      this.dayHabitMetrics = { 
        ...this.dayHabitMetrics, 
        ...await habitService.fetchHabitMetrics(uid, start, end, options) 
      };
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
      const photoCacheStore = usePhotoCacheStore();
      const uid = userStore.getUserId;

      // Get the index for sorting
      const habits = await habitService.fetchHabits(uid);
      const index = habits.length;

      // Use provided habitId or generate a new one
      const habitId = habitData.id || crypto.randomUUID();

      // Save cached photos to database first
      const savedPhotos = await photoCacheStore.saveToDatabase(habitId, uid);
      
      await habitService.addHabit({
        ...habitData,
        userId: uid,
        index,
        imageUrls: savedPhotos, // Add saved photo references
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