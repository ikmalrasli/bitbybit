import { defineStore } from 'pinia';
import { habitService } from '../services/habitService';
import { useUserStore } from '../store/userStore';
import { useUIStore } from './uiStore';
import { usePhotoCacheStore } from './photoCacheStore';
import { useToastStore } from './toastStore';
import { getLocalDateKey } from '../utils/dateHelpers';

export const useHabitStore = defineStore('habitStore', {
  state: () => ({
    dayHabitMetrics: {},
    hasAnyHabit: false,
    selectedHabit: null,
    hasMigratedPhotosThisSession: false,
    isMigrating: false
  }),
  actions: {
    // REFRESH LOGIC: Re-fetches the metrics for the current visible range
    async refreshMetrics() {
      const uiStore = useUIStore();
      const userStore = useUserStore();
      const today = new Date();
      const startRange = new Date(today);
      startRange.setDate(today.getDate() - 28); // Covers the 4-week view
      
      // Just fetch metrics - no migration logic here
      await this.getHabitMetrics(startRange, today);
    },

    async getHabitMetrics(start, end) {
      const userStore = useUserStore();
      const uid = userStore.getUserId;
      
      // Just fetch metrics - no migration options needed
      this.dayHabitMetrics = { 
        ...this.dayHabitMetrics, 
        ...await habitService.fetchHabitMetrics(uid, start, end) 
      };
      console.log(this.dayHabitMetrics);
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
        const dateKey = getLocalDateKey(new Date());
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
        const dateKey = getLocalDateKey(new Date());
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
    },

    async sortHabits(sortType) {
      const userStore = useUserStore();
      const uid = userStore.getUserId;
      const habits = await habitService.fetchHabits(uid);
      return habitService.sortHabits(habits, sortType);
    },

    sortHabitsSync(habits, sortType) {
      return habitService.sortHabits(habits, sortType);
    },

    async markHabitsCompleted() {
      const uiStore = useUIStore();
      const userStore = useUserStore();
      const toastStore = useToastStore();
      
      if (uiStore.selectedHabits.length === 0) {
        toastStore.showToast({
          message: 'No habits selected',
          type: 'warning',
          duration: 2000
        });
        return;
      }

      try {
        await habitService.markMultipleHabitsCompleted(
          uiStore.selectedHabits,
          userStore.getUserId,
          uiStore.selectedDate
        );

        toastStore.showToast({
          message: 'Habits completed!',
          type: 'success',
          duration: 1000
        });

        // Clear selection and exit selection mode
        uiStore.selectedHabits = [];
        uiStore.selectionMode = false;

        // Refresh metrics to update UI
        await this.refreshMetrics();

      } catch (error) {
        console.error('Error marking habits as completed:', error);
        toastStore.showToast({
          message: 'Error. Please try again.',
          type: 'error',
          duration: 2000
        });
      }
    },

    async initializeApp() {
      // If we already did this, bail out immediately.
      if (this.hasMigratedPhotosThisSession || this.isMigrating) return;
      
      const userStore = useUserStore();
      if (!userStore.getUserId) return;
      
      this.isMigrating = true;
      try {
        console.log('🚀 Starting photo migration on app launch...');
        await habitService.runPhotoMigration(userStore.getUserId);
        this.hasMigratedPhotosThisSession = true;
        console.log('✅ Photo migration completed on app launch');
      } catch (error) {
        console.error('❌ Photo migration failed on app launch:', error);
      } finally {
        this.isMigrating = false;
      }
    }
  }
});