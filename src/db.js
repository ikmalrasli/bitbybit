// src/db.js - Dexie IndexedDB for local-first habit tracker
import Dexie from 'dexie';

export const db = new Dexie('bitbybitDB');

db.version(1).stores({
  habits: 'id, userId',
  memos: 'id, userId, timestamp',
  news: 'id, category, date',
  pauses: 'id, habitId',
  progress: 'id, habitId, timestamp, [habitId+timestamp]',
  sunnahs: 'id',
  users: 'uid, email',
  user_metadata: 'id, userId',
  user_tokens: 'id, userId, platform',
  settings: 'key',
});

// Version 2: Add synchronization fields
db.version(2).stores({
  habits: 'id, userId, syncStatus, updatedAt',
  memos: 'id, userId, timestamp, syncStatus, updatedAt',
  news: 'id, category, date',
  pauses: 'id, habitId, syncStatus, updatedAt',
  progress: 'id, habitId, timestamp, [habitId+timestamp], syncStatus, updatedAt',
  sunnahs: 'id',
  users: 'uid, email',
  user_metadata: 'id, userId',
  user_tokens: 'id, userId, platform',
  settings: 'key',
});

// Version 3: Add photos table for local-first photo storage
db.version(3).stores({
  habits: 'id, userId, syncStatus, updatedAt',
  memos: 'id, userId, timestamp, syncStatus, updatedAt',
  news: 'id, category, date',
  pauses: 'id, habitId, syncStatus, updatedAt',
  progress: 'id, habitId, timestamp, [habitId+timestamp], syncStatus, updatedAt',
  sunnahs: 'id',
  users: 'uid, email',
  user_metadata: 'id, userId',
  user_tokens: 'id, userId, platform',
  settings: 'key',
  photos: 'id, habitId, userId, syncStatus, timestamp, createdAt, updatedAt',
});

// Version 4: LWW sync schema - isDirty/isDeleted, numeric updatedAt, sync indexes
db.version(4).stores({
  habits: 'id, userId, isDirty, isDeleted, updatedAt, [userId+isDirty], [userId+updatedAt], [userId+isDeleted]',
  memos: 'id, userId, isDirty, isDeleted, updatedAt, [userId+isDirty], [userId+updatedAt], [userId+isDeleted]',
  news: 'id, category, date',
  pauses: 'id, habitId, isDirty, isDeleted, updatedAt, [userId+isDirty], [userId+updatedAt], [userId+isDeleted]',
  progress: 'id, habitId, timestamp, isDirty, isDeleted, updatedAt, [habitId+timestamp], [userId+isDirty], [userId+updatedAt], [userId+isDeleted]',
  sunnahs: 'id',
  users: 'uid, email',
  user_metadata: 'id, userId',
  user_tokens: 'id, userId, platform',
  settings: 'key',
  photos: 'id, habitId, userId, isDirty, isDeleted, updatedAt, [userId+isDirty], [userId+updatedAt], [userId+isDeleted]',
}).upgrade(async (tx) => {
  // Migrate syncStatus → isDirty, ensure isDeleted default, convert Date → ms
  const tables = ['habits', 'memos', 'pauses', 'progress', 'photos'];

  for (const tableName of tables) {
    const table = tx.table(tableName);
    await table.toCollection().modify(record => {
      // Migrate syncStatus to isDirty
      if (record.syncStatus === 'pending') {
        record.isDirty = true;
      } else if (record.syncStatus === 'synced') {
        record.isDirty = false;
      } else {
        // Default: mark as dirty to ensure push happens
        record.isDirty = true;
      }
      delete record.syncStatus;

      // Default isDeleted to false
      record.isDeleted = record.isDeleted ?? false;

      // Convert Date updatedAt to number (ms)
      if (record.updatedAt instanceof Date) {
        record.updatedAt = record.updatedAt.getTime();
      } else if (typeof record.updatedAt !== 'number') {
        // Fallback: set to current time if missing/invalid
        record.updatedAt = Date.now();
      }
    });
  }
});
