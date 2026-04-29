// src/services/syncEngine.js - Firestore LWW sync engine (Phase 4)
import { db } from '../db';
import {
  collection,
  doc,
  writeBatch,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  Timestamp,
  limit
} from 'firebase/firestore';

// Constants
const SYNC_BATCH_SIZE = 500; // Firestore batch limit
const SYNCED_COLLECTIONS = ['habits', 'progress', 'memos', 'pauses'];
const LAST_SYNCED_KEY = (uid) => `lastSyncedAt:${uid}`;

// ============================================================================
// Converters: Firestore Timestamp ↔ numeric ms
// ============================================================================

/**
 * Convert local numeric ms to Firestore Timestamp for upload
 */
function toFirestoreTimestamp(ms) {
  if (!ms) return Timestamp.now();
  return Timestamp.fromMillis(Number(ms));
}

/**
 * Convert Firestore Timestamp to numeric ms for local storage
 */
function fromFirestoreTimestamp(ts) {
  if (!ts) return Date.now();
  if (ts instanceof Timestamp) return ts.toMillis();
  if (typeof ts === 'number') return ts;
  if (typeof ts === 'object' && ts.seconds !== undefined) {
    return ts.seconds * 1000 + Math.floor(ts.nanoseconds / 1000000);
  }
  return Date.now();
}

/**
 * Convert local Date or number to Firestore Timestamp
 */
function toFirestoreDate(value) {
  if (!value) return null;
  if (value instanceof Timestamp) return value;
  if (value instanceof Date) return Timestamp.fromDate(value);
  if (typeof value === 'number') return Timestamp.fromMillis(value);
  if (typeof value === 'string') return Timestamp.fromDate(new Date(value));
  return null;
}

/**
 * Convert Firestore Timestamp/Date to Date for Dexie
 */
function fromFirestoreDate(value) {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') return new Date(value);
  return null;
}

// ============================================================================
// Payload sanitization
// ============================================================================

/**
 * Prepare record for Firestore upload
 * - Convert updatedAt to Timestamp
 * - Strip local-only fields (isDirty)
 * - Keep isDeleted for tombstone sync
 * - Convert Date fields to Timestamps
 */
function sanitizeForUpload(record, collectionName) {
  const { isDirty, ...clean } = record;

  const payload = {
    ...clean,
    updatedAt: toFirestoreTimestamp(clean.updatedAt),
    userId: clean.userId, // Ensure userId is set
  };

  // Convert date fields based on collection
  if (collectionName === 'habits') {
    if (clean.termStart) payload.termStart = toFirestoreDate(clean.termStart);
    if (clean.termEnd) payload.termEnd = toFirestoreDate(clean.termEnd);
    if (clean.createdAt) payload.createdAt = toFirestoreDate(clean.createdAt);
  }

  if (collectionName === 'progress') {
    if (clean.timestamp) payload.timestamp = toFirestoreDate(clean.timestamp);
  }

  if (collectionName === 'pauses') {
    if (clean.start) payload.start = toFirestoreDate(clean.start);
    if (clean.end) payload.end = toFirestoreDate(clean.end);
  }

  if (collectionName === 'memos') {
    if (clean.timestamp) payload.timestamp = toFirestoreDate(clean.timestamp);
    if (clean.createdAt) payload.createdAt = toFirestoreDate(clean.createdAt);
  }

  return payload;
}

/**
 * Prepare Firestore document for local storage
 * - Convert Timestamps to numeric ms or Date
 * - Set isDirty: false (synced from server)
 * - Preserve isDeleted
 */
function sanitizeForLocal(docData, docId, collectionName) {
  const record = {
    ...docData,
    id: docId,
    updatedAt: fromFirestoreTimestamp(docData.updatedAt),
    isDirty: false,
  };

  // Convert date fields based on collection
  if (collectionName === 'habits') {
    if (docData.termStart) record.termStart = fromFirestoreDate(docData.termStart);
    if (docData.termEnd) record.termEnd = fromFirestoreDate(docData.termEnd);
    if (docData.createdAt) record.createdAt = fromFirestoreDate(docData.createdAt);
  }

  if (collectionName === 'progress') {
    if (docData.timestamp) record.timestamp = fromFirestoreDate(docData.timestamp);
  }

  if (collectionName === 'pauses') {
    if (docData.start) record.start = fromFirestoreDate(docData.start);
    if (docData.end) record.end = fromFirestoreDate(docData.end);
  }

  if (collectionName === 'memos') {
    if (docData.timestamp) record.timestamp = fromFirestoreDate(docData.timestamp);
    if (docData.createdAt) record.createdAt = fromFirestoreDate(docData.createdAt);
  }

  return record;
}

// ============================================================================
// Cursor management
// ============================================================================

async function getLastSyncedAt(uid) {
  const setting = await db.settings.get(LAST_SYNCED_KEY(uid));
  return setting?.value || 0;
}

async function setLastSyncedAt(uid, timestamp) {
  await db.settings.put({
    key: LAST_SYNCED_KEY(uid),
    value: timestamp,
  });
}

// ============================================================================
// Push: Upload dirty records to Firestore
// ============================================================================

/**
 * Push all dirty records to Firestore
 * Uses batches of 500 max
 * Stops and throws on error (no partial success)
 * @returns {Promise<{pushed: number}>}
 */
async function push(firestoreDb, uid) {
  const results = { pushed: 0 };

  for (const collectionName of SYNCED_COLLECTIONS) {
    // Query dirty records for this user using the [userId+isDirty] index
    const dirtyRecords = await db[collectionName]
      .where({ userId: uid, isDirty: 1 })
      .toArray();

    if (dirtyRecords.length === 0) continue;

    // Process in batches of 500
    for (let i = 0; i < dirtyRecords.length; i += SYNC_BATCH_SIZE) {
      const batch = dirtyRecords.slice(i, i + SYNC_BATCH_SIZE);
      const writeBatchRef = writeBatch(firestoreDb);

      for (const record of batch) {
        const payload = sanitizeForUpload(record, collectionName);
        const docRef = doc(collection(firestoreDb, collectionName), record.id);
        writeBatchRef.set(docRef, payload, { merge: true });
      }

      // Commit batch - throws on failure (stop and retry later as per spec)
      await writeBatchRef.commit();

      // Clear isDirty for successfully uploaded records
      for (const record of batch) {
        await db[collectionName].update(record.id, { isDirty: false });
      }

      results.pushed += batch.length;
    }
  }

  return results;
}

// ============================================================================
// Pull: Download updated records from Firestore
// ============================================================================

/**
 * Pull records updated since last sync
 * Uses cursor-based incremental sync
 * @returns {Promise<{pulled: number, maxUpdatedAt: number}>}
 */
async function pull(firestoreDb, uid, cursor) {
  const results = { pulled: 0, maxUpdatedAt: cursor };
  const cursorTimestamp = Timestamp.fromMillis(cursor);

  for (const collectionName of SYNCED_COLLECTIONS) {
    // Query: userId == uid && updatedAt > cursor
    const q = query(
      collection(firestoreDb, collectionName),
      where('userId', '==', uid),
      where('updatedAt', '>', cursorTimestamp),
      limit(1000) // Safety limit per collection
    );

    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
      const remoteData = docSnap.data();
      const remoteUpdatedAt = fromFirestoreTimestamp(remoteData.updatedAt);

      // Get local record if exists
      const localRecord = await db[collectionName].get(docSnap.id);

      // LWW merge: remote wins if newer or local doesn't exist
      if (!localRecord || remoteUpdatedAt >= localRecord.updatedAt) {
        const sanitized = sanitizeForLocal(remoteData, docSnap.id, collectionName);
        await db[collectionName].put(sanitized);
        results.pulled++;
      }

      // Track max updatedAt for cursor advancement
      if (remoteUpdatedAt > results.maxUpdatedAt) {
        results.maxUpdatedAt = remoteUpdatedAt;
      }
    }
  }

  return results;
}

// ============================================================================
// Full pull: Initial sync when cursor is 0
// ============================================================================

/**
 * Pull all records for user (initial sync / migration replacement)
 * This replaces syncService.fetchAllFromFirebase
 * @returns {Promise<{pulled: number}>}
 */
async function pullAll(firestoreDb, uid) {
  const results = { pulled: 0 };

  for (const collectionName of SYNCED_COLLECTIONS) {
    const q = query(
      collection(firestoreDb, collectionName),
      where('userId', '==', uid),
      limit(10000) // Large safety limit for initial sync
    );

    const snapshot = await getDocs(q);
    let maxUpdatedAt = 0;

    for (const docSnap of snapshot.docs) {
      const remoteData = docSnap.data();
      const sanitized = sanitizeForLocal(remoteData, docSnap.id, collectionName);
      await db[collectionName].put(sanitized);
      results.pulled++;

      const remoteUpdatedAt = fromFirestoreTimestamp(remoteData.updatedAt);
      if (remoteUpdatedAt > maxUpdatedAt) {
        maxUpdatedAt = remoteUpdatedAt;
      }
    }
  }

  // Set cursor to now after full pull
  await setLastSyncedAt(uid, Date.now());

  return results;
}

// ============================================================================
// Public API
// ============================================================================

export const syncEngine = {
  /**
   * Perform incremental sync: push dirty, then pull updates
   * @param {Firestore} firestoreDb - Firestore instance
   * @param {string} uid - User ID
   * @returns {Promise<{pushed: number, pulled: number, newCursor: number}>}
   */
  async sync(firestoreDb, uid) {
    if (!firestoreDb || !uid) {
      throw new Error('syncEngine.sync requires firestoreDb and uid');
    }

    const cursor = await getLastSyncedAt(uid);

    // Push first (upload local changes)
    const pushResult = await push(firestoreDb, uid);

    // Then pull (download remote changes)
    const pullResult = await pull(firestoreDb, uid, cursor);

    // Advance cursor
    const newCursor = Math.max(pullResult.maxUpdatedAt, Date.now());
    await setLastSyncedAt(uid, newCursor);

    return {
      pushed: pushResult.pushed,
      pulled: pullResult.pulled,
      newCursor,
    };
  },

  /**
   * Perform full initial sync (when no cursor exists)
   * @param {Firestore} firestoreDb - Firestore instance
   * @param {string} uid - User ID
   * @returns {Promise<{pulled: number}>}
   */
  async pullAllForUser(firestoreDb, uid) {
    if (!firestoreDb || !uid) {
      throw new Error('syncEngine.pullAllForUser requires firestoreDb and uid');
    }

    return await pullAll(firestoreDb, uid);
  },

  /**
   * Get current sync cursor for a user
   * @param {string} uid - User ID
   * @returns {Promise<number>} - Last synced timestamp in ms
   */
  async getCursor(uid) {
    return await getLastSyncedAt(uid);
  },

  /**
   * Reset sync cursor (useful for testing or full resync)
   * @param {string} uid - User ID
   * @param {number} value - New cursor value (default 0)
   */
  async resetCursor(uid, value = 0) {
    await setLastSyncedAt(uid, value);
  },

  // Expose constants for external use
  SYNCED_COLLECTIONS,
  SYNC_BATCH_SIZE,
};
