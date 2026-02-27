/**
 * Checks if a habit is paused on a specific day
 * @param {string} habitId - The ID of the habit to check
 * @param {Date|string} day - The day to check (Date object or string that can be converted to Date)
 * @param {Array} pauses - Array of pause objects with habitId, start, and optional end properties
 * @returns {boolean} - True if the habit is paused on the given day
 */
export function isHabitPausedOnDay(habitId, day, pauses) {
  // Normalize the day being checked to the very first and last millisecond of that day
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);

  return pauses?.some(pause => {
    if (pause.habitId !== habitId) return false;

    // Convert Database Timestamps to JS Dates
    const start = pause.start.toDate ? pause.start.toDate() : new Date(pause.start.seconds * 1000);
    const end = pause.end
      ? (pause.end.toDate ? pause.end.toDate() : new Date(pause.end.seconds * 1000))
      : null;

    if (end) {
      // Overlap Check: Does the pause start before the day ends AND end after the day begins?
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      return start <= dayEnd && end >= dayStart;
    } else {
      // Ongoing Pause Check: If the pause started ANYTIME before this day is over, the habit is paused.
      return start <= dayEnd;
    }
  });
}
