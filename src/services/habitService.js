import { db } from '../db';

export const habitService = {
  /**
   * Fetches habit metrics for a user within a date range.
   * @param {string} userId - The ID of the user.
   * @param {Date} startDate - The start date of the range.
   * @param {Date} endDate - The end date of the range.
   * @returns {Promise<Object>} - A promise that resolves to an object containing habit metrics.
   */
  async fetchHabitMetrics(userId, startDate, endDate) {
    const [habits, allProgress, pauses] = await Promise.all([
      db.habits.where('userId').equals(userId).toArray(),
      db.progress.where('timestamp').between(startDate, endDate).toArray(),
      db.pauses.toArray()
    ]);

    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const habitMetricsMap = {};

    // 1. Convert Progress into a "Fast Lookup" object: { 'habitId_2024-03-05': progressValue }
    const progressLookup = {};
    allProgress.forEach(p => {
      const dateKey = p.timestamp.toISOString().split('T')[0];
      progressLookup[`${p.habitId}_${dateKey}`] = p.progress;
    });

    // 2. Build the Day-by-Day View
    let current = new Date(startDate);
    while (current <= endDate) {
      const dateKey = current.toISOString().split('T')[0];
      const dayName = days[current.getDay()];

      habitMetricsMap[dateKey] = habits.filter(habit => {
        // A. Term Timeframe
        const isStarted = habit.termStart <= current;
        const isNotEnded = !habit.termEnd || habit.termEnd >= current;

        // Filter out habits that are not in the term timeframe
        return isStarted && isNotEnded;
      }).map(habit => {
        // B. Repeat Flag (is the habit scheduled for this day?)
        const isScheduled = habit.repeat?.[dayName];
        
        // C. Pause Logic (is the habit paused on this day?)
        const isPausedOnDay = pauses.some(p => 
          p.habitId === habit.id && 
          current >= new Date(p.start).setHours(0,0,0,0) && 
          (!p.end || current <= new Date(p.end).setHours(23,59,59,999))
        );

        return {
          ...habit,
          isScheduled,
          isPausedOnDay,
          actualProgress: progressLookup[`${habit.id}_${dateKey}`] || 0
        };
      });
      current.setDate(current.getDate() + 1);
    }

    return habitMetricsMap;
  }
};