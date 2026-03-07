import { db } from '../db';

export const habitService = {
  async fetchHabitMetrics(userId, startDate, endDate) {
    // 1. NORMALIZE BOUNDARIES
    // Ensure start is 00:00:00 and end is 23:59:59 of the local day
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const [habits, allProgress, pauses] = await Promise.all([
      db.habits.where('userId').equals(userId).toArray(),
      // Use inclusive bounds [start, end]
      db.progress.where('timestamp').between(start, end, true, true).toArray(),
      db.pauses.toArray()
    ]);

    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const habitMetricsMap = {};

    // Helper to get YYYY-MM-DD in local time
    const getLocalDateKey = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const progressLookup = {};
    allProgress.forEach(p => {
      const dateKey = getLocalDateKey(p.timestamp);
      progressLookup[`${p.habitId}_${dateKey}`] = p.progress;
    });

    // 2. BUILD THE VIEW
    let current = new Date(start);
    
    // The loop now covers the full range inclusive of the last millisecond
    while (current <= end) {
      const dateKey = getLocalDateKey(current);
      const dayName = days[current.getDay()];
      const currentTime = current.getTime();

      habitMetricsMap[dateKey] = habits.filter(habit => {
        // Normalize habit terms for comparison
        const termStart = habit.termStart ? new Date(habit.termStart).setHours(0,0,0,0) : 0;
        const termEnd = habit.termEnd ? new Date(habit.termEnd).setHours(23,59,59,999) : Infinity;
        
        return currentTime >= termStart && currentTime <= termEnd;
      }).map(habit => {
        const isScheduled = habit.repeat?.[dayName];
        
        const isPausedOnDay = pauses.some(p => {
          if (p.habitId !== habit.id) return false;
          const pStart = new Date(p.start).setHours(0,0,0,0);
          const pEnd = p.end ? new Date(p.end).setHours(23,59,59,999) : Infinity;
          return currentTime >= pStart && currentTime <= pEnd;
        });

        return {
          ...habit,
          isScheduled,
          isPausedOnDay,
          actualProgress: progressLookup[`${habit.id}_${dateKey}`] || 0
        };
      });

      // Advance by 1 day
      current.setDate(current.getDate() + 1);
    }

    return habitMetricsMap;
  },

  async checkIfAnyHabitExists(userId) {
    const habits = await db.habits.where('userId').equals(userId).toArray();
    return habits.length > 0;
  }
};