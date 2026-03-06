import { db } from '../db';

export const habitService = {
  async getWeeklyData(userId, startDate, endDate) {
    // 1. Get all raw data for the week in 3 quick local calls
    const [habits, allProgress] = await Promise.all([
      db.habits.where('userId').equals(userId).toArray(),                         
      db.progress.where('timestamp').between(startDate, endDate).toArray()
    ]);

    // 2. Map the data into a "Day-by-Day" object
    const calendarMap = {};
    
    // Iterate through the date range
    let current = new Date(startDate);
    while (current <= endDate) {
      const dateKey = current.toISOString().split('T')[0];
      const dayTimestamp = current;

      // Filter habits valid for THIS specific day
      calendarMap[dateKey] = habits.filter(habit => {
        const isStarted = habit.termStart <= dayTimestamp;
        const isNotEnded = !habit.termEnd || habit.termEnd >= dayTimestamp;

        return isStarted && isNotEnded;
      });

      current.setDate(current.getDate() + 1);
    }
    return { calendarMap, allProgress };
  }
};

