/**
 * Timestamp utilities for IndexedDB migration.
 * Converts between milliseconds (IndexedDB storage) and Firestore-like objects.
 */

/**
 * Convert milliseconds to Firestore-like { seconds, nanoseconds } object.
 * Used when reading from Dexie to maintain compatibility with existing code
 * that expects Firestore Timestamp shapes (e.g., getTotalProgressDay.js).
 * 
 * @param {number|null|undefined} ms - Timestamp in milliseconds
 * @returns {{ seconds: number, nanoseconds: number }|null}
 */
export function toTimestampLike(ms) {
  if (ms == null) return null;
  if (typeof ms === 'object' && ms.seconds != null) return ms; // Already in correct format
  if (typeof ms !== 'number') return null;
  
  const seconds = Math.floor(ms / 1000);
  const nanoseconds = (ms % 1000) * 1e6;
  return { seconds, nanoseconds };
}

/**
 * Convert a timestamp (ms, Firestore-like, or Date) to milliseconds.
 * Used when writing to Dexie.
 * 
 * @param {number|{seconds: number, nanoseconds?: number}|Date|null} ts
 * @returns {number|null}
 */
export function toMillis(ts) {
  if (ts == null) return null;
  if (typeof ts === 'number') return ts;
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts.toDate === 'function') return ts.toDate().getTime();
  if (typeof ts.seconds === 'number') {
    return ts.seconds * 1000 + ((ts.nanoseconds || 0) / 1e6);
  }
  return null;
}

/**
 * Convert a timestamp to a JavaScript Date.
 * Handles milliseconds, Firestore-like objects, and Date instances.
 * 
 * @param {number|{seconds: number, nanoseconds?: number}|Date|null} ts
 * @returns {Date|null}
 */
export function toDate(ts) {
  const ms = toMillis(ts);
  return ms != null ? new Date(ms) : null;
}
