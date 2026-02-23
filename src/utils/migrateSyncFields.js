/**
 * Migration utility to add sync fields to existing records
 * This should be run once when upgrading to the sync-enabled version
 */

import { db } from '../db';
import * as Sentry from '@sentry/vue';

/**
 * Add syncStatus and updatedAt fields to existing records
 */
export async function migrateSyncFields() {
  console.log('[Sync Migration] Starting migration of sync fields');
  
  try {
    const settingsKey = 'sync_fields_migrated';
    const migrationComplete = await db.settings.get(settingsKey);
    
    if (migrationComplete?.value === true) {
      console.log('[Sync Migration] Already completed, skipping');
      return;
    }

    const collections = ['habits', 'progress', 'memos', 'pauses'];
    const now = Date.now();
    
    for (const collectionName of collections) {
      console.log(`[Sync Migration] Processing ${collectionName}`);
      
      // Get all records without syncStatus
      const records = await db[collectionName].toArray();
      const recordsToUpdate = records.filter(record => !record.syncStatus);
      
      if (recordsToUpdate.length === 0) {
        console.log(`[Sync Migration] No records to update in ${collectionName}`);
        continue;
      }
      
      // Add sync fields to each record
      const updatedRecords = recordsToUpdate.map(record => ({
        ...record,
        syncStatus: 'synced', // Mark existing records as already synced
        updatedAt: record.updatedAt || now
      }));
      
      await db[collectionName].bulkPut(updatedRecords);
      console.log(`[Sync Migration] Updated ${updatedRecords.length} records in ${collectionName}`);
    }
    
    // Mark migration as complete
    await db.settings.put({ key: settingsKey, value: true });
    console.log('[Sync Migration] Completed successfully');
    
  } catch (error) {
    console.error('[Sync Migration] Failed:', error);
    Sentry.captureException(error, { tags: { action: 'migrateSyncFields' } });
    throw error;
  }
}
