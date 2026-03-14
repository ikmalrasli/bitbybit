import { defineStore } from 'pinia';
import { habitService } from '../services/habitService';
import { useUserStore } from './userStore';

export const useStatStore = defineStore('statStore', {
  state: () => ({
    // Use a single Date object set to the 1st of the current month
    viewDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    monthlyCache: {},
    selectedStat: null,
    loading: false
  }),
  
  getters: {
    // Easily extract Month and Year for the service and UI
    month: (state) => state.viewDate.getMonth(),
    year: (state) => state.viewDate.getFullYear(),
    
    cacheKey: (state) => `${state.viewDate.getFullYear()}-${state.viewDate.getMonth()}`,
    
    currentMonthHabits: (state) => {
      return state.monthlyCache[state.cacheKey] || [];
    }
  },

  actions: {
    // One function to rule them all
    async loadStats() {
      const userStore = useUserStore();
      const key = this.cacheKey;
      
      // If we already have it, don't fetch again (unless you want to force refresh)
      if (this.monthlyCache[key]) return;

      this.loading = true;
      try {
        const data = await habitService.fetchMonthlySummary(
          userStore.getUserId, 
          this.month, 
          this.year
        );
        console.log(data);
        this.monthlyCache[key] = data;
      } finally {
        this.loading = false;
      }
    },

    // Simple "Set and Fetch" logic
    changeMonth(delta) {
      // Create a new date based on the current viewDate
      const newDate = new Date(this.viewDate);
      // JS automatically handles year rollovers if month becomes < 0 or > 11
      newDate.setMonth(newDate.getMonth() + delta);
      this.viewDate = newDate;
      
      this.loadStats();
    }
  }
});