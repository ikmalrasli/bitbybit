/**
 * Test utility for sync engine functionality
 * Only exposed in development mode
 */

import { performFullSync, markForSync } from './syncEngine';
import { db } from '../db';

export function exposeSyncUtils() {
  if (import.meta.env.DEV) {
    window.__syncTest = {
      // Test functions
      async testSync() {
        console.log('[Sync Test] Starting full sync test');
        try {
          await performFullSync();
          console.log('[Sync Test] ✅ Full sync completed successfully');
        } catch (error) {
          console.error('[Sync Test] ❌ Full sync failed:', error);
        }
      },
      
      async testMarkForSync(tableName, recordId) {
        console.log(`[Sync Test] Marking ${recordId} in ${tableName} for sync`);
        try {
          await markForSync(tableName, recordId);
          console.log('[Sync Test] ✅ Record marked for sync');
        } catch (error) {
          console.error('[Sync Test] ❌ Failed to mark record for sync:', error);
        }
      },
      
      // Inspection functions
      async inspectPendingRecords() {
        const collections = ['habits', 'progress', 'memos', 'pauses'];
        const pending = {};
        
        for (const collection of collections) {
          const records = await db[collection].where('syncStatus').equals('pending').toArray();
          if (records.length > 0) {
            pending[collection] = records;
          }
        }
        
        console.log('[Sync Test] Pending records:', pending);
        return pending;
      },
      
      async inspectLastSyncTimestamp() {
        const setting = await db.settings.get('lastSyncTimestamp');
        console.log('[Sync Test] Last sync timestamp:', setting?.value);
        return setting?.value;
      },
      
      async inspectAllRecords(tableName) {
        const records = await db[tableName].toArray();
        console.log(`[Sync Test] All records in ${tableName}:`, records);
        return records;
      },
      
      // Helper to create test data
      async createTestProgress() {
        const testProgress = {
          habitId: 'test-habit-' + Date.now(),
          progress: 1,
          timestamp: Date.now(),
          onTime: true,
          syncStatus: 'pending',
          updatedAt: Date.now()
        };
        
        try {
          const id = await db.progress.add(testProgress);
          console.log('[Sync Test] ✅ Created test progress record:', id);
          return id;
        } catch (error) {
          console.error('[Sync Test] ❌ Failed to create test progress:', error);
        }
      }
    };
    
    console.log('[Sync Test] 💡 Sync test utilities exposed at window.__syncTest');
    console.log('[Sync Test] Available methods:');
    console.log('  - testSync() - Perform full sync');
    console.log('  - testMarkForSync(tableName, recordId) - Mark record for sync');
    console.log('  - inspectPendingRecords() - Show all pending records');
    console.log('  - inspectLastSyncTimestamp() - Show last sync time');
    console.log('  - inspectAllRecords(tableName) - Show all records in table');
    console.log('  - createTestProgress() - Create test progress record');
  }
}
