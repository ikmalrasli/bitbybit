/**
 * Lazy migration: fetch user data from Firebase and store in Dexie (IndexedDB).
 * Converts all Firestore Timestamps to milliseconds for IndexedDB compatibility.
 * Runs once per user when migration_complete_{uid} is not set.
 */
import { db } from '../db';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db as firestoreDb } from '../firebase';

/**
 * Converts Firestore Timestamp (or { seconds, nanoseconds }) to milliseconds.
 * IndexedDB cannot store/sort Firebase Timestamp objects.
 */
function toMillis(ts) {
  if (ts == null) return null;
  if (typeof ts === 'number') return ts;
  if (ts && typeof ts.toMillis === 'function') return ts.toMillis();
  if (ts && typeof ts.toDate === 'function') return ts.toDate().getTime();
  if (ts && typeof ts.seconds === 'number') {
    return ts.seconds * 1000 + ((ts.nanoseconds || 0) / 1e6);
  }
  if (ts instanceof Date) return ts.getTime();
  return null;
}

/**
 * Migrate a single habit: convert timestamps, ensure id/habitId.
 */
function mapHabit(docSnap) {
  const data = docSnap.data();
  const id = docSnap.id;
  return {
    id,
    habitId: id, // Compatibility with existing code
    ...data,
    termStart: data.termStart != null ? toMillis(data.termStart) : null,
    termEnd: data.termEnd != null ? toMillis(data.termEnd) : null,
    createdAt: data.createdAt != null ? toMillis(data.createdAt) : null,
  };
}

/**
 * Migrate a single progress entry.
 */
function mapProgress(docSnap) {
  const data = docSnap.data();
  const id = docSnap.id;
  return {
    id,
    progressId: id,
    ...data,
    timestamp: data.timestamp != null ? toMillis(data.timestamp) : null,
  };
}

/**
 * Migrate a single memo.
 */
function mapMemo(docSnap) {
  const data = docSnap.data();
  const id = docSnap.id;
  return {
    id,
    memoId: id,
    ...data,
    timestamp: data.timestamp != null ? toMillis(data.timestamp) : null,
  };
}

/**
 * Migrate a single pause.
 */
function mapPause(docSnap) {
  const data = docSnap.data();
  const id = docSnap.id;
  return {
    id,
    pauseId: id,
    ...data,
    start: data.start != null ? toMillis(data.start) : null,
    end: data.end != null ? toMillis(data.end) : null,
  };
}

/**
 * Migrate user data from Firebase to Dexie. Idempotent: skips if already migrated.
 * @param {import('firebase/auth').User} firebaseUser - Authenticated Firebase user
 */
export async function migrateUserFromFirebase(firebaseUser) {
  if (!firebaseUser?.uid) return;

  const uid = firebaseUser.uid;
  const settingsKey = `migration_complete_${uid}`;

  try {
    const row = await db.settings.get(settingsKey);
    if (row?.value === true) {
      return; // Already migrated
    }

    // 1. Habits
    const habitsQuery = query(
      collection(firestoreDb, 'habits'),
      where('userId', '==', uid)
    );
    const habitsSnapshot = await getDocs(habitsQuery);
    const habits = habitsSnapshot.docs.map(mapHabit);
    if (habits.length > 0) {
      await db.habits.bulkPut(habits);
    }

    const habitIds = habits.map((h) => h.id);

    // 2. Progress (batched: Firestore 'in' limit is 30)
    const progressRows = [];
    for (let i = 0; i < habitIds.length; i += 30) {
      const batchIds = habitIds.slice(i, i + 30);
      const progressQuery = query(
        collection(firestoreDb, 'progress'),
        where('habitId', 'in', batchIds)
      );
      const progressSnapshot = await getDocs(progressQuery);
      progressSnapshot.docs.forEach((d) => progressRows.push(mapProgress(d)));
    }
    if (progressRows.length > 0) {
      await db.progress.bulkPut(progressRows);
    }

    // 3. Memos
    const memosQuery = query(
      collection(firestoreDb, 'memos'),
      where('userId', '==', uid)
    );
    const memosSnapshot = await getDocs(memosQuery);
    const memos = memosSnapshot.docs.map(mapMemo);
    if (memos.length > 0) {
      await db.memos.bulkPut(memos);
    }

    // 4. Pauses (batched)
    const pauseRows = [];
    for (let i = 0; i < habitIds.length; i += 30) {
      const batchIds = habitIds.slice(i, i + 30);
      const pausesQuery = query(
        collection(firestoreDb, 'pauses'),
        where('habitId', 'in', batchIds)
      );
      const pausesSnapshot = await getDocs(pausesQuery);
      pausesSnapshot.docs.forEach((d) => pauseRows.push(mapPause(d)));
    }
    if (pauseRows.length > 0) {
      await db.pauses.bulkPut(pauseRows);
    }

    // 5. User doc (users/{uid})
    const userRef = doc(firestoreDb, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      await db.users.put({ uid, ...userData });
    }

    // 6. User metadata (users/{uid}/metadata/news)
    const userNewsRef = doc(firestoreDb, 'users', uid, 'metadata', 'news');
    const userNewsSnap = await getDoc(userNewsRef);
    if (userNewsSnap.exists()) {
      const metaData = userNewsSnap.data();
      const lastRead = metaData.lastRead != null ? toMillis(metaData.lastRead) : null;
      await db.user_metadata.put({
        id: `news_${uid}`,
        userId: uid,
        lastRead,
      });
    }

    await db.settings.put({ key: settingsKey, value: true });
    console.log('[Dexie Migration] Completed for user', uid);
  } catch (error) {
    console.error('[Dexie Migration] Failed:', error);
    throw error; // Re-throw so caller can handle; do NOT set migration_complete
  }
}
