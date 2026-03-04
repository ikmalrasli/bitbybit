import { db } from '../db';

export const habitService = {
  // Get habits for a specific day (Logic moved from store/index.js)
  async getHabitsByDate(date) {
    const dayTimestamp = new Date(date).setHours(0, 0, 0, 0);
    return await db.habits
      .where('userId')
      .equals(currentUserId) // You'll get this from UserStore
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