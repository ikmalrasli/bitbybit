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
