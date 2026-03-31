import { db } from '../db';
import { generateId } from '../utils/generateId';

export const habitService = {
  /**
   * Fetches habit metrics for a user within a date range.
   * Used in calendar-row component in home page.
   */
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
    const progressID = {};

    allProgress.forEach(p => {
      const dateKey = getLocalDateKey(p.timestamp);
      progressLookup[`${p.habitId}_${dateKey}`] = p.progress;
      progressID[`${p.habitId}_${dateKey}`] = p.id;
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
        const termStart = habit.termStart ? new Date(habit.termStart).setHours(0, 0, 0, 0) : 0;
        const termEnd = habit.termEnd ? new Date(habit.termEnd).setHours(23, 59, 59, 999) : Infinity;

        return currentTime >= termStart && currentTime <= termEnd;
      }).map(habit => {
        const isScheduled = habit.repeat?.[dayName];

        const isPausedOnDay = pauses.some(p => {
          if (p.habitId !== habit.id) return false;

          // 1. Get the start of the day the pause began
          const pauseStartDay = new Date(p.start).setHours(0, 0, 0, 0);

          // 2. Get the end of the day the pause ended (or Infinity if active)
          // If p.end exists, we set it to 23:59:59 of that day to ensure it's inclusive
          const pauseEndDay = p.end
            ? new Date(p.end).setHours(23, 59, 59, 999)
            : Infinity;

          // 3. A habit is paused if the CURRENT loop day (at 00:00) 
          // falls within the start and end days of the pause record.
          return currentTime >= pauseStartDay && currentTime <= pauseEndDay;
        });

        return {
          ...habit,
          isScheduled,
          isPausedOnDay,
          actualProgress: progressLookup[`${habit.id}_${dateKey}`] || 0,
          progressId: progressID[`${habit.id}_${dateKey}`] || null
        };
      });

      // Advance by 1 day
      current.setDate(current.getDate() + 1);
    }

    return habitMetricsMap;
  },

  /**
   * Checks if any habits exist for a user.
   * Used in home page for first-time user.
   */
  async checkIfAnyHabitExists(userId) {
    const habits = await db.habits.where('userId').equals(userId).toArray();
    return habits.length > 0;
  },


  /**
   * Fetches monthly stats for a user within a date range.
   * Used in stats page.
   */
  async fetchMonthlySummary(userId, month, year) {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    // Reuse the existing high-speed function
    const dailyMap = await this.fetchHabitMetrics(userId, startOfMonth, endOfMonth);

    const summary = {};

    // Aggregate daily data into habit totals
    Object.values(dailyMap).forEach(dayHabits => {
      dayHabits.forEach(h => {
        if (!summary[h.id]) {
          summary[h.id] = {
            ...h,
            totalGoal: 0,
            totalProgress: 0
          };
        }

        // Only add to goal if scheduled AND not paused
        if (h.isScheduled && !h.isPausedOnDay) {
          summary[h.id].totalGoal += (h.dailyGoal || 0);
          summary[h.id].totalProgress += (h.actualProgress || 0);
        }
      });
    });

    // Calculate percentages and return as array
    return Object.values(summary).map(habit => ({
      ...habit,
      progressPercent: habit.totalGoal > 0
        ? Math.min(100, Math.round((habit.totalProgress / habit.totalGoal) * 100))
        : 0
    }));
  },

  /**
   * Progress CRUD
   */
  async updateProgress(progressId, userId, habitId, progress, date) {
    if (progress === 0) {
      if (progressId) await db.progress.delete(progressId);
    } else {
      const recordId = progressId || generateId();
      // Upsert: Create or Update based on progressId
      await db.progress.put({
        id: recordId,
        habitId,
        userId,
        progress,
        timestamp: new Date(date), // Ensure we use the date context
        onTime: this._isToday(date)
      });
    }
  },

  /**
   * Habit CRUD
   */
  async fetchHabits(userId) {
    return await db.habits.where('userId').equals(userId).toArray();
  },

  async toggleHabitPause(habitId, isPaused) {
    const now = new Date();

    // 1. Update the habit's pause status
    await db.habits.update(habitId, { isPaused });

    // 2. Handle the pauses table
    if (isPaused) {
      return await db.pauses.add({
        id: generateId(),
        habitId,
        start: now,
        end: null
      });
    } else {
      // Find the active pause (where end is null)
      const activePause = await db.pauses
        .where('habitId').equals(habitId)
        .filter(p => p.end === null)
        .first();

      if (activePause) {
        const pStart = new Date(activePause.start);

        // If resumed on the same day it started: DELETE (Cancel the pause)
        if (pStart.toDateString() === now.toDateString()) {
          await db.pauses.delete(activePause.id);
        } else {
          // If resumed on a later day: END it at the very end of YESTERDAY
          // This ensures fetchHabitMetrics sees 'Today' as outside the pause range.
          const yesterday = new Date();
          yesterday.setDate(now.getDate() - 1);
          yesterday.setHours(23, 59, 59, 999);

          await db.pauses.update(activePause.id, { end: yesterday });
        }
      }
    }
  },

  async updateHabitDetails(habitId, updates) {
    return await db.habits.update(habitId, updates);
  },

  async deleteHabitFull(habitId) {
    return await db.transaction('rw', [db.habits, db.progress, db.pauses], async () => {
      await db.progress.where('habitId').equals(habitId).delete();
      await db.pauses.where('habitId').equals(habitId).delete();
      await db.habits.delete(habitId);
    });
  },

  async addHabit(habitData) {
    const habitId = habitData.id || generateId();
    const now = new Date();

    await db.habits.add({
      id: habitId,
      ...habitData,
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    });

    return habitId;
  },

  _isToday(date) {
    const today = new Date();
    const d = new Date(date);
    return today.toDateString() === d.toDateString();
  }
};