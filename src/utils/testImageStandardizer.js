/**
 * Test file for imageDataStandardizer utilities
 * This file can be run in the browser console to test Phase 3.1 functionality
 */

import { standardizeImageData, generateConsistentId, extractFilename } from './imageDataStandardizer.js';

/**
 * Test data samples
 */
const testSamples = {
  // Legacy format habit
  legacyHabit: {
    id: 'habit-123',
    name: 'Test Habit',
    imageUrls: [
      'https://firebasestorage.googleapis.com/v0/b/app.appspot.com/habit_img/user123/Reading/photo1.jpg',
      'https://firebasestorage.googleapis.com/v0/b/app.appspot.com/habit_img/user123/Reading/photo2.jpg'
    ]
  },
  
  // New format habit
  newFormatHabit: {
    id: 'habit-456',
    name: 'New Test Habit',
    imageUrls: [
      { id: 'photo-abc-123', fileName: 'image1.jpg' },
      { id: 'photo-def-456', fileName: 'image2.jpg' }
    ]
  },
  
  // Mixed format (shouldn't happen but we handle it)
  mixedHabit: {
    id: 'habit-789',
    name: 'Mixed Habit',
    imageUrls: [
      'https://firebasestorage.googleapis.com/v0/b/app.appspot.com/habit_img/user123/Mixed/photo1.jpg',
      { id: 'photo-xyz-789', fileName: 'image2.jpg' }
    ]
  },
  
  // Habit with no images
  noImagesHabit: {
    id: 'habit-000',
    name: 'Empty Habit',
    imageUrls: []
  }
};

/**
 * Test functions
 */
export async function runImageStandardizerTests() {
  console.log('🧪 Starting Image Standardizer Tests...\n');
  
  try {
    // Test 1: Legacy format detection
    console.log('📋 Test 1: Legacy Format Detection');
    const legacyResult = await standardizeImageData(testSamples.legacyHabit);
    console.log('Legacy habit result:', {
      isLegacy: legacyResult.isLegacy,
      needsMigration: legacyResult.needsMigration,
      photoCount: legacyResult.standardizedImageUrls.length,
      migrationPlanItems: legacyResult.migrationPlan.length
    });
    
    // Verify legacy detection
    if (legacyResult.isLegacy && legacyResult.needsMigration) {
      console.log('✅ Legacy format correctly detected');
    } else {
      console.error('❌ Legacy format detection failed');
    }
    
    // Test 2: New format detection
    console.log('\n📋 Test 2: New Format Detection');
    const newFormatResult = await standardizeImageData(testSamples.newFormatHabit);
    console.log('New format habit result:', {
      isLegacy: newFormatResult.isLegacy,
      needsMigration: newFormatResult.needsMigration,
      photoCount: newFormatResult.standardizedImageUrls.length
    });
    
    // Verify new format detection
    if (!newFormatResult.isLegacy && !newFormatResult.needsMigration) {
      console.log('✅ New format correctly detected');
    } else {
      console.error('❌ New format detection failed');
    }
    
    // Test 3: Consistent ID generation
    console.log('\n📋 Test 3: Consistent ID Generation');
    const testUrl = 'https://example.com/test.jpg';
    const id1 = generateConsistentId(testUrl);
    const id2 = generateConsistentId(testUrl);
    
    if (id1 === id2) {
      console.log('✅ Consistent ID generation works');
      console.log(`Generated ID: ${id1}`);
    } else {
      console.error('❌ Consistent ID generation failed');
      console.log(`ID1: ${id1}, ID2: ${id2}`);
    }
    
    // Test 4: Filename extraction
    console.log('\n📋 Test 4: Filename Extraction');
    const testUrls = [
      'https://firebasestorage.googleapis.com/v0/b/app.appspot.com/habit_img/user123/Reading/photo1.jpg',
      'https://example.com/path/to/image.png',
      'https://cdn.example.com/images/photo-with-dashes.jpeg'
    ];
    
    testUrls.forEach(url => {
      const filename = extractFilename(url);
      console.log(`URL: ${url}`);
      console.log(`Extracted filename: ${filename}`);
    });
    
    // Test 5: Empty imageUrls
    console.log('\n📋 Test 5: Empty ImageUrls');
    const emptyResult = await standardizeImageData(testSamples.noImagesHabit);
    console.log('Empty images result:', {
      isLegacy: emptyResult.isLegacy,
      needsMigration: emptyResult.needsMigration,
      photoCount: emptyResult.standardizedImageUrls.length
    });
    
    if (emptyResult.photoCount === 0) {
      console.log('✅ Empty imageUrls handled correctly');
    } else {
      console.error('❌ Empty imageUrls handling failed');
    }
    
    console.log('\n🎉 All tests completed!');
    
    return {
      success: true,
      results: {
        legacy: legacyResult,
        newFormat: newFormatResult,
        empty: emptyResult
      }
    };
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Helper function to test with real habit data from the database
 * This can be run in the browser console with actual habit data
 */
export async function testWithRealHabit(habitId) {
  try {
    console.log(`🔍 Testing with real habit: ${habitId}`);
    
    // Import db dynamically for console testing
    const { db } = await import('../db.js');
    const habit = await db.habits.where('id').equals(habitId).first();
    
    if (!habit) {
      console.error('❌ Habit not found');
      return;
    }
    
    console.log('Found habit:', habit.name);
    console.log('Current imageUrls:', habit.imageUrls);
    
    const result = await standardizeImageData(habit);
    console.log('Standardization result:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error testing with real habit:', error);
  }
}

// Export test samples for manual testing
export { testSamples };

// Auto-run tests if this file is imported in a development environment
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🚀 Image Standardizer tests available. Run runImageStandardizerTests() to start.');
}
