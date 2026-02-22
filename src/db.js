// src/db.js - Dexie IndexedDB for local-first habit tracker
import Dexie from 'dexie';

export const db = new Dexie('HabitTrackerDB');

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
