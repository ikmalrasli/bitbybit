import { db } from '../db';
import { generateId } from '../utils/generateId';
import { processMultipleHabits } from './photoDownloadService';

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

    // Just fetch habits - no migration logic here
    const habits = await this.fetchHabits(userId);

    const [allProgress, pauses] = await Promise.all([
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

  /**
 * Dedicated photo migration method
 * Separates migration logic from data fetching
 * @param {string} userId - The user ID
 * @param {Object} options - Migration options
 * @returns {Promise<Object>} - Migration results
 */
async runPhotoMigration(userId, options = {}) {
  const { maxConcurrent = 2 } = options;
  
  // First, fetch habits from local IndexedDB
  const habits = await this.fetchHabits(userId);
  
  if (habits.length === 0) {
    console.log('✅ No habits found, skipping migration');
    return { habitsProcessed: 0, totalDownloadsCompleted: 0, totalDownloadsFailed: 0 };
  }
  
  // Filter habits that need migration
  const habitsNeedingMigration = habits.filter(habit => {
    // Check if habit has imageUrls and hasn't completed migration
    return habit.imageUrls && 
           habit.imageUrls.length > 0 && 
           !habit.localMigrationComplete;
  });
  
  if (habitsNeedingMigration.length === 0) {
    console.log('✅ All habits are already migrated');
    return { habitsProcessed: 0, totalDownloadsCompleted: 0, totalDownloadsFailed: 0 };
  }
  
  console.log(`🔄 Starting migration for ${habitsNeedingMigration.length} habits`);
  
  try {
    // Make it blocking - wait for completion to prevent race condition
    const results = await processMultipleHabits(habitsNeedingMigration, userId, {
      maxConcurrent,
      delayBetween: 500
    });
    
    console.log('🎉 Migration completed:', {
      habitsProcessed: results.habitsProcessed,
      downloadsCompleted: results.totalDownloadsCompleted,
      downloadsFailed: results.totalDownloadsFailed
    });
    
    return results;
    
  } catch (error) {
    console.error('❌ Error starting habit migration:', error);
    throw error;
  }
},

/**
 * Fetches habits with automatic photo migration
 * DEPRECATED: Use runPhotoMigration separately for cleaner architecture
 * This method is kept for backward compatibility
 * @param {string} userId - The user ID
 * @param {Object} options - Migration options
 * @returns {Promise<Array>} - Array of habits with migrated photos
 */
async fetchHabitsWithMigration(userId, options = {}) {
  console.warn('⚠️ fetchHabitsWithMigration is deprecated. Use runPhotoMigration for migration and fetchHabits for data fetching.');
  
  const { enableMigration = true, maxConcurrent = 2 } = options;
  
  // First, fetch habits from local IndexedDB
  const habits = await this.fetchHabits(userId);
  
  if (!enableMigration || habits.length === 0) {
    return habits;
  }
  
  // Run migration if needed
  await this.runPhotoMigration(userId, { maxConcurrent });
  
  // Return habits after migration completes
  return habits;
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

  /**
   * Sorts habits based on the specified sort type
   * @param {Array} habits - Array of habit objects
   * @param {string} sortType - 'name', 'color', or 'custom'
   * @returns {Array} - Sorted array of habits
   */
  sortHabits(habits, sortType) {
    const sortedHabits = [...habits];
    
    if (sortType === 'name') {
      sortedHabits.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortType === 'color') {
      const colorOrder = {
        "red-300": 0,
        "orange-300": 1,
        "yellow-300": 2,
        "emerald-300": 3,
        "blue-300": 4,
        "pink-300": 5,
        "violet-400": 6
      };

      // Sort by color first, then alphabetically by name within the same color
      sortedHabits.sort((a, b) => {
        const colorA = colorOrder[a.color?.default || "violet-400"] ?? 99;
        const colorB = colorOrder[b.color?.default || "violet-400"] ?? 99;

        // First, compare color order
        if (colorA !== colorB) {
          return colorA - colorB;
        }

        // If colors are the same, sort alphabetically by name
        return a.name.localeCompare(b.name);
      });
    } else if (sortType === 'custom') {
      sortedHabits.sort((a, b) => (a.index ?? sortedHabits.length) - (b.index ?? sortedHabits.length));
    }
    
    return sortedHabits;
  },

  /**
   * Marks multiple habits as completed for a specific date
   * @param {Array} habitIds - Array of habit IDs to mark as completed
   * @param {string} userId - User ID
   * @param {Date} targetDate - Date to mark habits for (defaults to today)
   * @returns {Promise} - Promise that resolves when all operations complete
   */
  async markMultipleHabitsCompleted(habitIds, userId, targetDate = new Date()) {
    let setTimestamp = new Date(targetDate);
    let onTime = this._isToday(targetDate);

    if (!onTime) {
      // For past dates, set timestamp to end of that day
      setTimestamp = new Date(targetDate);
      setTimestamp.setHours(23, 59, 59, 999);
    }

    // Fetch all habits to get their daily goals
    const habits = await this.fetchHabits(userId);
    const habitMap = habits.reduce((map, habit) => {
      map[habit.id] = habit;
      return map;
    }, {});

    const updatePromises = habitIds.map(async (habitId) => {
      const habit = habitMap[habitId];
      if (!habit) {
        console.warn(`Habit ${habitId} not found for user ${userId}`);
        return null;
      }

      const dailyGoal = habit.dailyGoal || 0;
      
      // Check if progress already exists for this habit and date
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existingProgress = await db.progress
        .where('habitId').equals(habitId)
        .and(p => p.timestamp >= startOfDay && p.timestamp <= endOfDay)
        .first();

      if (existingProgress) {
        // Update existing progress
        return await db.progress.update(existingProgress.id, {
          progress: dailyGoal,
          timestamp: setTimestamp,
          onTime: onTime
        });
      } else {
        // Create new progress record
        const progressId = generateId();
        return await db.progress.add({
          id: progressId,
          habitId,
          userId,
          progress: dailyGoal,
          timestamp: setTimestamp,
          onTime: onTime
        });
      }
    });

    // Wait for all promises to resolve
    return await Promise.all(updatePromises);
  },

  _isToday(date) {
    const today = new Date();
    const d = new Date(date);
    return today.toDateString() === d.toDateString();
  }
};