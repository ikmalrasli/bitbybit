import { db } from '../db';
import { getUserId } from '../stores/UserStore';

// TODO: recheck and rewrite these methods
export const habitService = {
  // Get habits for a specific day
  async getHabitsByDate(date) {
    const dayTimestamp = new Date(date).setHours(0, 0, 0, 0);
    return await db.habits
      .where('userId')
      .equals(getUserId()) // TODO: check if you need to useStore here instead of getUserId() directly
      .and(habit => habit.termStart <= dayTimestamp)
      .and(habit => habit.termEnd >= dayTimestamp)
      .orderBy('name') // TODO: Add sorting options later
      .toArray();
  },

  // Replacement for fetchWeekProgress() logic
  async getWeekProgress(habitIds, startDate, endDate) {
    return await db.progress
      .where('timestamp')
      .between(startDate, endDate)
      .and(p => habitIds.includes(p.habitId))
      .toArray();
  },

  // Save progress (Logic moved from markHabitsCompleted mutation)
  async updateProgress(habitId, value, date) {
    const timestamp = new Date(date);
    return await db.progress.put({
      id: `${habitId}_${timestamp.getTime()}`, // unique ID
      habitId,
      timestamp,
      progress: value,
      syncStatus: 'pending',
      updatedAt: new Date()
    });
  }
};