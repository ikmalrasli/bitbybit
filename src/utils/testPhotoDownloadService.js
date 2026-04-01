/**
 * Test file for photoDownloadService utilities
 * This file can be run in the browser console to test Phase 3.2 functionality
 */

import { 
  downloadToCache, 
  batchDownloadPhotos, 
  processHabitImages, 
  isPhotoCached, 
  getPhotoBlobUrl,
  revokeBlobUrl
} from '../services/photoDownloadService.js';
import { standardizeImageData } from './imageDataStandardizer.js';

/**
 * Test data for download service
 */
const testDownloadData = {
  sampleUrl: 'https://picsum.photos/200/300',
  habitId: 'test-habit-123',
  photoId: 'test-photo-456',
  fileName: 'test-image.jpg',
  userId: 'test-user-789'
};

/**
 * Test single photo download
 */
export async function testSingleDownload() {
  console.log('🧪 Testing single photo download...');
  
  try {
    const result = await downloadToCache(
      testDownloadData.sampleUrl,
      testDownloadData.habitId,
      testDownloadData.photoId,
      testDownloadData.fileName
    );
    
    console.log('✅ Single download successful:', result);
    
    // Test if photo is now cached
    const isCached = await isPhotoCached(testDownloadData.photoId);
    console.log(`📦 Photo cached: ${isCached}`);
    
    // Test getting blob URL
    const blobUrl = await getPhotoBlobUrl(testDownloadData.photoId);
    console.log(`🔗 Blob URL: ${blobUrl ? 'Generated' : 'Failed'}`);
    
    // Cleanup
    if (blobUrl) {
      revokeBlobUrl(blobUrl);
      console.log('🧹 Blob URL revoked');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Single download test failed:', error);
    throw error;
  }
}

/**
 * Test batch download
 */
export async function testBatchDownload() {
  console.log('🧪 Testing batch photo download...');
  
  try {
    const downloadPlan = [
      {
        urlString: 'https://picsum.photos/200/300?random=1',
        habitId: 'test-habit-batch',
        photoId: 'batch-photo-1',
        filename: 'batch-image-1.jpg'
      },
      {
        urlString: 'https://picsum.photos/200/300?random=2',
        habitId: 'test-habit-batch',
        photoId: 'batch-photo-2',
        filename: 'batch-image-2.jpg'
      },
      {
        urlString: 'https://picsum.photos/200/300?random=3',
        habitId: 'test-habit-batch',
        photoId: 'batch-photo-3',
        filename: 'batch-image-3.jpg'
      }
    ];
    
    const results = await batchDownloadPhotos(downloadPlan, testDownloadData.userId);
    
    console.log('✅ Batch download completed:', {
      successful: results.successful.length,
      failed: results.failed.length,
      total: downloadPlan.length
    });
    
    if (results.failed.length > 0) {
      console.warn('⚠️ Failed downloads:', results.failed);
    }
    
    return results;
  } catch (error) {
    console.error('❌ Batch download test failed:', error);
    throw error;
  }
}

/**
 * Test habit image processing
 */
export async function testHabitImageProcessing() {
  console.log('🧪 Testing habit image processing...');
  
  try {
    // Create a mock habit with legacy imageUrls
    const mockHabit = {
      id: 'test-habit-processing',
      name: 'Test Processing Habit',
      userId: testDownloadData.userId,
      imageUrls: [
        'https://picsum.photos/200/300?random=4',
        'https://picsum.photos/200/300?random=5',
        'https://picsum.photos/200/300?random=6'
      ]
    };
    
    // First test the standardizer
    const standardizationResult = await standardizeImageData(mockHabit);
    console.log('📋 Standardization result:', {
      isLegacy: standardizationResult.isLegacy,
      needsMigration: standardizationResult.needsMigration,
      migrationPlanItems: standardizationResult.migrationPlan.length
    });
    
    // Then test the processing
    const processingResult = await processHabitImages(mockHabit, testDownloadData.userId);
    
    console.log('✅ Habit processing completed:', processingResult);
    
    return processingResult;
  } catch (error) {
    console.error('❌ Habit processing test failed:', error);
    throw error;
  }
}

/**
 * Test error handling with invalid URL
 */
export async function testErrorHandling() {
  console.log('🧪 Testing error handling...');
  
  try {
    await downloadToCache(
      'https://invalid-url-that-does-not-exist.com/image.jpg',
      'error-test-habit',
      'error-test-photo',
      'error-image.jpg'
    );
    
    console.error('❌ Error handling test failed - should have thrown an error');
  } catch (error) {
    console.log('✅ Error handling works correctly:', error.message);
  }
}

/**
 * Test photo cache utilities
 */
export async function testCacheUtilities() {
  console.log('🧪 Testing cache utilities...');
  
  try {
    const testPhotoId = 'cache-test-photo';
    
    // Test non-existent photo
    const notCached = await isPhotoCached(testPhotoId);
    console.log(`📦 Non-existent photo cached: ${notCached}`);
    
    const noBlobUrl = await getPhotoBlobUrl(testPhotoId);
    console.log(`🔗 Non-existent photo blob URL: ${noBlobUrl ? 'Generated' : 'Null (expected)'}`);
    
    // Test with a real downloaded photo
    const downloadResult = await downloadToCache(
      testDownloadData.sampleUrl,
      'cache-test-habit',
      testPhotoId,
      'cache-test-image.jpg'
    );
    
    // Now test if it's cached
    const isCached = await isPhotoCached(testPhotoId);
    console.log(`📦 Downloaded photo cached: ${isCached}`);
    
    const blobUrl = await getPhotoBlobUrl(testPhotoId);
    console.log(`🔗 Downloaded photo blob URL: ${blobUrl ? 'Generated' : 'Failed'}`);
    
    // Test URL revocation
    revokeBlobUrl(blobUrl);
    revokeBlobUrl('invalid-url'); // Should not throw error
    console.log('✅ URL revocation works correctly');
    
    return downloadResult;
  } catch (error) {
    console.error('❌ Cache utilities test failed:', error);
    throw error;
  }
}

/**
 * Run all download service tests
 */
export async function runDownloadServiceTests() {
  console.log('🚀 Starting Photo Download Service Tests...\n');
  
  const results = {
    singleDownload: null,
    batchDownload: null,
    habitProcessing: null,
    errorHandling: null,
    cacheUtilities: null
  };
  
  try {
    // Test 1: Single download
    console.log('📋 Test 1: Single Photo Download');
    results.singleDownload = await testSingleDownload();
    
    // Test 2: Batch download
    console.log('\n📋 Test 2: Batch Photo Download');
    results.batchDownload = await testBatchDownload();
    
    // Test 3: Habit processing
    console.log('\n📋 Test 3: Habit Image Processing');
    results.habitProcessing = await testHabitImageProcessing();
    
    // Test 4: Error handling
    console.log('\n📋 Test 4: Error Handling');
    results.errorHandling = await testErrorHandling();
    
    // Test 5: Cache utilities
    console.log('\n📋 Test 5: Cache Utilities');
    results.cacheUtilities = await testCacheUtilities();
    
    console.log('\n🎉 All download service tests completed!');
    
    return {
      success: true,
      results
    };
    
  } catch (error) {
    console.error('❌ Download service tests failed:', error);
    return {
      success: false,
      error: error.message,
      results
    };
  }
}

/**
 * Test with real habit data from the database
 * This can be run in the browser console with actual habit data
 */
export async function testWithRealHabitDownload(habitId) {
  try {
    console.log(`🔍 Testing download with real habit: ${habitId}`);
    
    // Import dependencies
    const { db } = await import('../db.js');
    const { useUserStore } = await import('../store/userStore.js');
    
    // Get habit and user data
    const habit = await db.habits.where('id').equals(habitId).first();
    const userStore = useUserStore();
    const userId = userStore.getUserId;
    
    if (!habit) {
      console.error('❌ Habit not found');
      return;
    }
    
    if (!habit.imageUrls || habit.imageUrls.length === 0) {
      console.log('ℹ️ Habit has no images to test');
      return;
    }
    
    console.log('Found habit:', habit.name);
    console.log('Current imageUrls:', habit.imageUrls);
    
    // Test processing
    const result = await processHabitImages(habit, userId);
    console.log('Processing result:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error testing with real habit download:', error);
  }
}

// Export test data for manual testing
export { testDownloadData };

// Auto-run tests if this file is imported in a development environment
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🚀 Photo Download Service tests available. Run runDownloadServiceTests() to start.');
}
