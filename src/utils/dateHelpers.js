/**
 * Unified date helper functions to ensure consistent date key generation across the application
 * Prevents timezone mismatches between data storage and retrieval
 */

/**
 * Creates a date key in YYYY-MM-DD format using local timezone
 * This replaces inconsistent usage of toISOString().split('T')[0] which causes timezone issues
 * @param {Date} date - The date to convert
 * @returns {string} Date key in YYYY-MM-DD format
 */
export function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Creates a date key from year, month, day components
 * Useful for calendar components that work with individual date components
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @param {number} day - Day
 * @returns {string} Date key in YYYY-MM-DD format
 */
export function getDateKeyFromComponents(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Gets today's date key in local timezone
 * @returns {string} Today's date key in YYYY-MM-DD format
 */
export function getTodayDateKey() {
  return getLocalDateKey(new Date());
}

/**
 * Checks if a date key represents today
 * @param {string} dateKey - Date key in YYYY-MM-DD format
 * @returns {boolean} True if the date key is today
 */
export function isToday(dateKey) {
  return dateKey === getTodayDateKey();
}
