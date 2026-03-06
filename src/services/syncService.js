// src/services/syncService.js
import { db as dexieDb } from '../db';
import { db as firestoreDb } from '../firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useUserStore } from '../store/userStore';

const convertToDate = (value) => {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'object' && value !== null) {
    // Handle object with seconds and nanoseconds properties
    if (value.seconds && value.nanoseconds) {
      return new Date(value.seconds * 1000 + value.nanoseconds / 1000000);
    }
  }
  return null;
};

export const syncService = {
  async fetchAllFromFirebase(uid) {
    const userStore = useUserStore();
    const userId = uid || userStore.getUserId;

    if (!userId) throw new Error("User must be logged in to sync data.");

    const collectionsToSync = ['habits', 'progress', 'memos', 'pauses'];

    console.log("🚀 Starting initial data migration...");

    for (const colName of collectionsToSync) {
      try {
        // 1. Fetch from Firebase
        const q = query(collection(firestoreDb, colName), where('userId', '==', userId));
        const snapshot = await getDocs(q);

        const data = snapshot.docs.map(doc => {
          const rawData = doc.data();
          const baseData = {
            ...rawData,
            id: doc.id,
            // Convert Firebase Timestamps to JS Dates for Dexie
            updatedAt: convertToDate(rawData.updatedAt) || new Date(),
            timestamp: convertToDate(rawData.timestamp),
            syncStatus: 'synced' // Mark as already synced
          };

          // Only convert termStart and termEnd for habits collection
          if (colName === 'habits') {
            baseData.termStart = convertToDate(rawData.termStart);
            baseData.termEnd = convertToDate(rawData.termEnd);
            baseData.createdAt = convertToDate(rawData.createdAt);
          }

          if (colName === 'pauses') {
            baseData.start = convertToDate(rawData.pauseStart);
            baseData.end = convertToDate(rawData.pauseEnd);
          }

          return baseData;
        });

        // 2. Bulk Save to Dexie
        if (data.length > 0) {
          await dexieDb[colName].bulkPut(data);
          console.log(`✅ Migrated ${data.length} records to local table: ${colName}`);
        }
      } catch (error) {
        console.error(`❌ Failed to sync ${colName}:`, error);
      }
    }

    console.log("🏁 Migration complete!");
  }
};