/**
 * Synchronization Engine for BitByBit
 * Keeps local Dexie DB in sync with Firebase Firestore while minimizing read costs
 */

import { db } from '../db';
import { db as firestoreDb } from '../firebase';
import { toMillis, toTimestampLike } from './timestampUtils';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  writeBatch, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp,
  deleteDoc 
} from 'firebase/firestore';
import * as Sentry from '@sentry/vue';

// Collections that need synchronization
const SYNC_COLLECTIONS = ['habits', 'progress', 'memos', 'pauses'];

// Store reference to the Vuex store for UI refresh
let vuexStore = null;

/**
 * Get current user ID from global variable set by initializeSyncEngine
 */
function getUserId() {
  try {
    // Use the global variable set by initializeSyncEngine
    if (typeof window !== 'undefined' && window.__currentUserUid) {
      return window.__currentUserUid;
    }
    return null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}
async function getLastSyncTimestamp() {
  try {
    const setting = await db.settings.get('lastSyncTimestamp');
    return setting?.value || null;
  } catch (error) {
    console.error('Error getting last sync timestamp:', error);
    Sentry.captureException(error, { tags: { action: 'getLastSyncTimestamp' } });
    return null;
  }
}

/**
 * Update the last sync timestamp in local settings
 */
async function setLastSyncTimestamp(timestamp) {
  try {
    await db.settings.put({
      key: 'lastSyncTimestamp',
      value: timestamp
    });
  } catch (error) {
    console.error('Error setting last sync timestamp:', error);
    Sentry.captureException(error, { tags: { action: 'setLastSyncTimestamp' } });
    throw error;
  }
}

/**
 * Get pending records from a specific table
 */
async function getPendingRecords(tableName) {
  try {
    return await db[tableName].where('syncStatus').equals('pending').toArray();
  } catch (error) {
    console.error(`Error getting pending records from ${tableName}:`, error);
    Sentry.captureException(error, { 
      tags: { action: 'getPendingRecords', table: tableName } 
    });
    return [];
  }
}

/**
 * Mark records as synced in local database
 */
async function markRecordsSynced(tableName, recordIds, serverUpdatedAt) {
  try {
    const updates = recordIds.map(id => ({
      id,
      syncStatus: 'synced',
      updatedAt: serverUpdatedAt
    }));
    
    await db[tableName].bulkPut(updates);
  } catch (error) {
    console.error(`Error marking records as synced in ${tableName}:`, error);
    Sentry.captureException(error, { 
      tags: { action: 'markRecordsSynced', table: tableName } 
    });
    throw error;
  }
}

/**
 * Push local changes to Firebase
 */
export async function syncLocalChanges() {
  console.log('[Sync] Starting local changes sync');
  
  try {
    const userId = getUserId();
    if (!userId) {
      console.warn('[Sync] No user ID found, skipping sync');
      return;
    }

    for (const collectionName of SYNC_COLLECTIONS) {
      const pendingRecords = await getPendingRecords(collectionName);
      
      if (pendingRecords.length === 0) {
        console.log(`[Sync] No pending records in ${collectionName}`);
        continue;
      }

      console.log(`[Sync] Syncing ${pendingRecords.length} pending records from ${collectionName}`);

      // Process in batches of 500 (Firestore batch limit)
      const batchSize = 500;
      for (let i = 0; i < pendingRecords.length; i += batchSize) {
        const batch = pendingRecords.slice(i, i + batchSize);
        await processBatch(collectionName, batch, userId);
      }
    }

    console.log('[Sync] Local changes sync completed');
  } catch (error) {
    console.error('[Sync] Error syncing local changes:', error);
    Sentry.captureException(error, { tags: { action: 'syncLocalChanges' } });
    throw error;
  }
}

/**
 * Process a batch of records for syncing
 */
async function processBatch(collectionName, records, userId) {
  const batch = writeBatch(firestoreDb);
  const recordIds = [];

  for (const record of records) {
    const docRef = doc(firestoreDb, collectionName, record.id);
    const { syncStatus, ...dataToSync } = record;

    // Add userId to all collections for direct querying
    dataToSync.userId = userId;

    // Convert timestamps to Firestore format
    if (dataToSync.timestamp) {
      dataToSync.timestamp = toTimestampLike(dataToSync.timestamp);
    }
    if (dataToSync.termStart) {
      dataToSync.termStart = toTimestampLike(dataToSync.termStart);
    }
    if (dataToSync.termEnd) {
      dataToSync.termEnd = toTimestampLike(dataToSync.termEnd);
    }
    if (dataToSync.start) {
      dataToSync.start = toTimestampLike(dataToSync.start);
    }
    if (dataToSync.end) {
      dataToSync.end = toTimestampLike(dataToSync.end);
    }

    // Add server timestamp for updatedAt
    dataToSync.updatedAt = serverTimestamp();

    // Handle soft deletes
    if (record._deleted) {
      batch.delete(docRef);
    } else {
      batch.set(docRef, dataToSync, { merge: true });
    }

    recordIds.push(record.id);
  }

  // Commit the batch
  await batch.commit();

  // Mark records as synced with current timestamp
  const serverUpdatedAt = Date.now();
  await markRecordsSynced(collectionName, recordIds, serverUpdatedAt);

  console.log(`[Sync] Batch synced ${recordIds.length} records from ${collectionName}`);
}

/**
 * Pull remote changes from Firebase
 */
export async function pullRemoteChanges() {
  console.log('[Sync] Starting remote changes pull');
  
  try {
    const userId = getUserId();
    if (!userId) {
      console.warn('[Sync] No user ID found, skipping pull');
      return;
    }

    const lastSyncTimestamp = await getLastSyncTimestamp();
    console.log(`[Sync] Last sync timestamp: ${lastSyncTimestamp}`);

    // Parallelize all collection pulls for better performance
    const pullPromises = SYNC_COLLECTIONS.map(collectionName => 
      pullCollectionChanges(collectionName, userId, lastSyncTimestamp)
    );
    
    await Promise.all(pullPromises);

    // Update last sync timestamp to current time
    await setLastSyncTimestamp(Date.now());
    console.log('[Sync] Remote changes pull completed');
  } catch (error) {
    console.error('[Sync] Error pulling remote changes:', error);
    Sentry.captureException(error, { tags: { action: 'pullRemoteChanges' } });
    throw error;
  }
}

/**
 * Pull changes for a specific collection
 */
async function pullCollectionChanges(collectionName, userId, lastSyncTimestamp) {
  try {
    const queryConstraints = [
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    ];

    // Add timestamp filter if we have a last sync timestamp
    if (lastSyncTimestamp) {
      queryConstraints.push(where('updatedAt', '>', new Date(lastSyncTimestamp)));
    }

    const q = query(
      collection(firestoreDb, collectionName),
      ...queryConstraints
    );

    const snapshot = await getDocs(q);
    await processRemoteChanges(collectionName, snapshot.docs, lastSyncTimestamp);
  } catch (error) {
    console.error(`[Sync] Error pulling changes for ${collectionName}:`, error);
    Sentry.captureException(error, { 
      tags: { action: 'pullCollectionChanges', collection: collectionName } 
    });
    throw error;
  }
}

/**
 * Process remote changes and apply to local database
 */
async function processRemoteChanges(collectionName, docs, lastSyncTimestamp) {
  const recordsToPut = [];
  const recordsToDelete = [];

  for (const docSnapshot of docs) {
    const data = docSnapshot.data();
    const updatedAt = toMillis(data.updatedAt);

    const id = docSnapshot.id;
    
    // Handle soft deletes
    if (data._deleted) {
      recordsToDelete.push(id);
      continue;
    }

    // Convert data for local storage
    const localData = {
      id,
      ...data,
      syncStatus: 'synced',
      updatedAt: updatedAt || Date.now()
    };

    // Convert timestamps to milliseconds for local storage
    if (data.timestamp) {
      localData.timestamp = toMillis(data.timestamp);
    }
    if (data.termStart) {
      localData.termStart = toMillis(data.termStart);
    }
    if (data.termEnd) {
      localData.termEnd = toMillis(data.termEnd);
    }
    if (data.start) {
      localData.start = toMillis(data.start);
    }
    if (data.end) {
      localData.end = toMillis(data.end);
    }

    recordsToPut.push(localData);
  }

  // Apply changes to local database
  if (recordsToPut.length > 0) {
    await db[collectionName].bulkPut(recordsToPut);
    console.log(`[Sync] Updated ${recordsToPut.length} records in ${collectionName}`);
  }

  if (recordsToDelete.length > 0) {
    await db[collectionName].bulkDelete(recordsToDelete);
    console.log(`[Sync] Deleted ${recordsToDelete.length} records from ${collectionName}`);
  }
}

/**
 * Perform full synchronization (push local changes + pull remote changes)
 */
export async function performFullSync() {
  console.log('[Sync] Starting full synchronization');
  
  try {
    // Push local changes first
    await syncLocalChanges();
    
    // Then pull remote changes
    await pullRemoteChanges();
    
    // Update last sync timestamp
    await setLastSyncTimestamp(Date.now());
    
    console.log('[Sync] Full synchronization completed successfully');
    
    // Trigger UI refresh by dispatching store actions
    if (vuexStore && vuexStore.state.isAuthenticated) {
      console.log('[Sync] Refreshing UI data');
      
      // Refresh habits
      await vuexStore.dispatch('fetchHabits').catch(error => {
        console.error('[Sync] Error refreshing habits:', error);
      });
      
      // Refresh progress
      await vuexStore.dispatch('fetchWeekProgress').catch(error => {
        console.error('[Sync] Error refreshing progress:', error);
      });
      
      // Refresh memos
      await vuexStore.dispatch('fetchWeekMemos').catch(error => {
        console.error('[Sync] Error refreshing memos:', error);
      });
      
      // Refresh pauses
      await vuexStore.dispatch('fetchPauses').catch(error => {
        console.error('[Sync] Error refreshing pauses:', error);
      });
      
      console.log('[Sync] UI data refreshed successfully');
    }
    
  } catch (error) {
    console.error('[Sync] Full synchronization failed:', error);
    Sentry.captureException(error, { tags: { action: 'performFullSync' } });
    throw error;
  }
}

/**
 * Perform synchronization - alias for performFullSync for backward compatibility
 * This is the function that should be imported by other modules
 */
export async function performSync() {
  return await performFullSync();
}

/**
 * Mark a record as pending sync (to be called when local changes are made)
 */
export async function markForSync(tableName, recordId) {
  try {
    await db[tableName].update(recordId, { syncStatus: 'pending' });
  } catch (error) {
    console.error(`[Sync] Error marking record ${recordId} for sync:`, error);
    Sentry.captureException(error, { 
      tags: { action: 'markForSync', table: tableName } 
    });
  }
}

/**
 * Initialize sync engine - set up event listeners
 */
export function initializeSyncEngine(store) {
  console.log('[Sync] Initializing sync engine');
  
  // Store the Vuex store reference for UI refresh
  vuexStore = store;

  // Listen for online events
  window.addEventListener('online', async () => {
    console.log('[Sync] Network connection restored, triggering sync');
    try {
      await performFullSync();
    } catch (error) {
      console.error('[Sync] Auto-sync failed:', error);
    }
  });

  // Listen for auth state changes
  const unsubscribe = store.subscribe((mutation, state) => {
    if (mutation.type === 'SET_USER' && state.user) {
      // Store user UID in a global variable for sync access
      if (typeof window !== 'undefined') {
        window.__currentUserUid = state.user.uid;
      }
      
      // Trigger initial sync after user authentication
      setTimeout(async () => {
        try {
          await performFullSync();
        } catch (error) {
          console.error('[Sync] Initial sync failed:', error);
        }
      }, 2000); // Delay to allow migration to complete
    } else if (mutation.type === 'CLEAR_USER') {
      // Clear user UID on logout
      if (typeof window !== 'undefined') {
        delete window.__currentUserUid;
      }
    }
  });

  return unsubscribe;
}
