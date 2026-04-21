import { db } from '../db.js';

const LAST_SYNCED_AT_KEY = 'lastSyncedAt';

function getCursorKey(userId) {
  return `${LAST_SYNCED_AT_KEY}:${userId}`;
}

export const settingsService = {
  /**
   * Get the last synced timestamp for a user (in milliseconds)
   * @param {string} userId
   * @returns {Promise<number>} timestamp in ms, or 0 if never synced
   */
  async getLastSyncedAt(userId) {
    if (!userId) return 0;
    const record = await db.settings.get(getCursorKey(userId));
    return record?.value ?? 0;
  },

  /**
   * Set the last synced timestamp for a user
   * @param {string} userId
   * @param {number} timestamp - milliseconds since epoch
   * @returns {Promise<void>}
   */
  async setLastSyncedAt(userId, timestamp) {
    if (!userId) return;
    const key = getCursorKey(userId);
    await db.settings.put({ key, value: timestamp });
  },

  /**
   * Reset the sync cursor for a user (useful for full re-sync)
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async resetLastSyncedAt(userId) {
    if (!userId) return;
    await db.settings.delete(getCursorKey(userId));
  }
};
