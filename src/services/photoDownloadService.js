/**
 * Photo Download Service - Phase 3.2
 * 
 * Handles downloading remote URLs and caching them as local Blobs
 * for the lazy migration approach.
 */

import { db } from '../db.js';

/**
 * Download utility to fetch remote images and cache them locally
 * @param {string} url - The remote URL to download
 * @param {string} habitId - The habit ID this photo belongs to
 * @param {string} photoId - The unique ID for this photo
 * @param {string} fileName - The filename for this photo
 * @returns {Promise<Object>} - Metadata object (without blob)
 */
export async function downloadToCache(url, habitId, photoId, fileName) {
  try {
    console.log(`📥 Downloading photo: ${fileName}`);
    console.log(`🔗 Original URL: ${url}`);
    
    // Enhanced idempotency check
    const existingPhoto = await db.photos.where('id').equals(photoId).first();
    if (existingPhoto) {
      console.log(`✅ Photo ${fileName} already exists locally, checking integrity...`);
      
      // Verify blob integrity
      if (existingPhoto.blob && existingPhoto.blob.size > 0) {
        console.log(`✅ Photo ${fileName} blob integrity verified, skipping download`);
        return {
          id: photoId,
          fileName: fileName,
          fileSize: existingPhoto.fileSize || 0,
          mimeType: existingPhoto.mimeType || 'image/jpeg',
          syncStatus: existingPhoto.syncStatus || 'synced',
          originalUrl: url,
          skipped: true // Flag to indicate this was skipped
        };
      } else {
        // Blob is corrupted or missing, delete and re-download
        console.log(`⚠️ Corrupted or missing blob detected for ${fileName}, re-downloading`);
        await db.photos.delete(photoId);
      }
    }
    
    // Step 1: Handle Firebase Storage URL encoding
    let downloadUrl = url;
    
    // Check if this is a Firebase Storage URL that needs special handling
    if (url.includes('firebasestorage.googleapis.com') || url.includes('storage.googleapis.com')) {
      console.log(`🔗 Firebase Storage URL detected: ${url}`);
      
      try {
        const urlObj = new URL(url);
        
        // Firebase Storage URLs have the object path in the pathname after /o/
        const pathname = urlObj.pathname;
        if (pathname.includes('/o/')) {
          const objectPath = pathname.split('/o/')[1]; // Get everything after /o/
          console.log(`📂 Extracted object path: ${objectPath}`);
          
          // Check if the path is already encoded
          // If it contains %2F or %20, it's likely already encoded
          const isAlreadyEncoded = objectPath.includes('%2F') || objectPath.includes('%20');
          
          let encodedPath;
          if (isAlreadyEncoded) {
            // Path is already encoded, use as-is
            console.log(`✅ Path appears to be already encoded, using as-is`);
            encodedPath = objectPath;
          } else {
            // Path is not encoded, encode it normally
            console.log(`🔧 Path needs encoding, applying encodeURIComponent`);
            encodedPath = encodeURIComponent(objectPath);
          }
          
          // Reconstruct the URL with the correct path
          const basePath = pathname.split('/o/')[0]; // Get everything before /o/
          const newPathname = basePath + '/o/' + encodedPath;
          downloadUrl = urlObj.origin + newPathname + urlObj.search;
          console.log(`🔗 Final URL: ${downloadUrl}`);
        }
      } catch (encodingError) {
        console.warn('Firebase URL encoding failed, using original URL:', encodingError.message);
        // Try fallback encoding for common cases
        if (url.includes(' ')) {
          downloadUrl = url.replace(/ /g, '%20');
          console.log(`🔗 Fallback space encoding applied: ${downloadUrl}`);
        }
      }
    }
    
    // Step 2: Fetch the image data with proper headers and error handling
    let response;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount <= maxRetries) {
      try {
        response = await fetch(downloadUrl, {
          method: 'GET',
          headers: {
            'Accept': 'image/*',
            'User-Agent': 'Mozilla/5.0 (compatible; BitByBit-App)',
          },
          mode: 'cors'
        });
        
        if (response.ok) {
          break; // Success, exit retry loop
        }
        
        // If we got a non-OK response and have retries left
        if (retryCount < maxRetries) {
          console.warn(`⚠️ Download attempt ${retryCount + 1} failed with status ${response.status}, retrying...`);
          retryCount++;
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount - 1) * 1000));
          continue;
        }
        
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        
      } catch (fetchError) {
        if (retryCount < maxRetries) {
          console.warn(`⚠️ Network error on attempt ${retryCount + 1}, retrying...`, fetchError.message);
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount - 1) * 1000));
          continue;
        }
        throw fetchError; // Re-throw if we've exhausted retries
      }
    }
    
    // Step 3: Convert response to Blob
    const blob = await response.blob();
    
    // Step 4: Verify we got image data
    if (!blob.type.startsWith('image/')) {
      throw new Error(`Downloaded file is not an image: ${blob.type}`);
    }
    
    // Step 4: Save to IndexedDB photos table
    const photoRecord = {
      id: photoId,
      habitId,
      userId: null, // Will be filled when called from habit context
      blob: blob,
      fileName: fileName,
      fileSize: blob.size,
      mimeType: blob.type,
      syncStatus: 'synced', // These are downloaded from cloud, so they're already synced
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      originalUrl: url // Keep reference to original URL
    };
    
    await db.photos.add(photoRecord);
    
    console.log(`✅ Successfully cached photo: ${fileName}`);
    
    // Step 5: Return metadata object (without blob)
    return {
      id: photoId,
      fileName: fileName,
      fileSize: blob.size,
      mimeType: blob.type,
      syncStatus: 'synced',
      originalUrl: url
    };
    
  } catch (error) {
    console.error(`❌ Failed to download photo ${fileName}:`, error);
    throw error;
  }
}

/**
 * Downloads multiple photos in parallel with error handling
 * @param {Array} downloadPlan - Array of download tasks from migration plan
 * @param {string} userId - The user ID for the photos
 * @returns {Promise<Array>} - Array of successful downloads and failures
 */
export async function batchDownloadPhotos(downloadPlan, userId) {
  const results = {
    successful: [],
    failed: [],
    skipped: []
  };
  
  // Create download promises with individual error handling
  const downloadPromises = downloadPlan.map(async (task) => {
    try {
      const metadata = await downloadToCache(
        task.urlString,
        task.habitId,
        task.photoId,
        task.filename
      );
      
      // Handle skipped downloads
      if (metadata.skipped) {
        console.log(`⏭️ Skipped already downloaded photo: ${task.filename}`);
        return {
          success: true,
          skipped: true,
          task,
          metadata
        };
      }
      
      // Update userId in the photo record for successful downloads
      await db.photos.update(task.photoId, { userId });
      
      return {
        success: true,
        skipped: false,
        task,
        metadata
      };
    } catch (error) {
      console.error(`Failed to download ${task.filename}:`, error);
      return {
        success: false,
        task,
        error: error.message
      };
    }
  });
  
  // Wait for all downloads to complete (or fail)
  const downloadResults = await Promise.all(downloadPromises);
  
  // Separate successful, failed, and skipped downloads
  downloadResults.forEach(result => {
    if (result.success) {
      if (result.skipped) {
        results.skipped.push(result);
      } else {
        results.successful.push(result);
      }
    } else {
      results.failed.push(result);
    }
  });
  
  console.log(`📊 Batch download complete: ${results.successful.length} downloaded, ${results.skipped.length} skipped, ${results.failed.length} failed`);
  
  return results;
}

/**
 * Processes habit imageUrls and downloads missing photos
 * @param {Object} habit - The habit object with imageUrls
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} - Processing results
 */
export async function processHabitImages(habit, userId) {
  try {
    console.log(`🔄 Processing images for habit: ${habit.name} (${habit.id})`);
    
    // Import the standardizer to get migration plan
    const { standardizeImageData } = await import('../utils/imageDataStandardizer.js');
    
    // Get standardized image data and migration plan
    const imageData = await standardizeImageData(habit);
    
    if (!imageData.needsMigration) {
      console.log(`✅ No migration needed for habit: ${habit.name}`);
      
      // Even if no downloads needed, we might need to update the migration flag
      // if photos are already cached but flag wasn't set
      if (imageData.isLegacy && !habit.localMigrationComplete && 
          imageData.standardizedImageUrls.every(photo => photo.isLocallyCached)) {
        console.log(`📝 Updating migration flag for already-cached habit: ${habit.name}`);
        const { updateHabitToNewFormat } = await import('../utils/imageDataStandardizer.js');
        await updateHabitToNewFormat(habit.id, imageData.standardizedImageUrls);
      }
      
      return {
        habitId: habit.id,
        processed: true,
        downloadsNeeded: 0,
        downloadsCompleted: 0,
        downloadsFailed: 0,
        updatedImageUrls: imageData.standardizedImageUrls,
        habitUpdated: true
      };
    }
    
    // Add habitId to each migration task
    const downloadPlan = imageData.migrationPlan.map(task => ({
      ...task,
      habitId: habit.id
    }));
    
    console.log(`📋 Download plan created: ${downloadPlan.length} photos to download`);
    
    // Execute batch download
    const downloadResults = await batchDownloadPhotos(downloadPlan, userId);
    
    // Update habit with new format if downloads were successful OR if photos were already cached
    let habitUpdated = false;
    const totalProcessed = downloadResults.successful.length + downloadResults.skipped.length;
    
    if (totalProcessed > 0 || 
        (imageData.isLegacy && imageData.standardizedImageUrls.every(photo => photo.isLocallyCached))) {
      // Import the update function
      const { updateHabitToNewFormat } = await import('../utils/imageDataStandardizer.js');
      
      habitUpdated = await updateHabitToNewFormat(habit.id, imageData.standardizedImageUrls);
      
      if (habitUpdated) {
        console.log(`✅ Updated habit ${habit.name} to new image format`);
      }
    }
    
    return {
      habitId: habit.id,
      processed: true,
      downloadsNeeded: downloadPlan.length,
      downloadsCompleted: downloadResults.successful.length,
      downloadsSkipped: downloadResults.skipped.length,
      downloadsFailed: downloadResults.failed.length,
      habitUpdated,
      updatedImageUrls: imageData.standardizedImageUrls,
      failedDownloads: downloadResults.failed
    };
    
  } catch (error) {
    console.error(`❌ Error processing habit images for ${habit.id}:`, error);
    return {
      habitId: habit.id,
      processed: false,
      error: error.message
    };
  }
}

/**
 * Processes multiple habits and downloads their images
 * @param {Array} habits - Array of habit objects
 * @param {string} userId - The user ID
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - Overall processing results
 */
export async function processMultipleHabits(habits, userId, options = {}) {
  const { maxConcurrent = 3, delayBetween = 1000 } = options;
  
  console.log(`🚀 Starting batch processing for ${habits.length} habits`);
  
  const results = {
    habitsProcessed: 0,
    totalDownloadsNeeded: 0,
    totalDownloadsCompleted: 0,
    totalDownloadsSkipped: 0,
    totalDownloadsFailed: 0,
    habitResults: [],
    errors: []
  };
  
  // Process habits in batches to avoid overwhelming the network
  for (let i = 0; i < habits.length; i += maxConcurrent) {
    const batch = habits.slice(i, i + maxConcurrent);
    
    console.log(`📦 Processing batch ${Math.floor(i / maxConcurrent) + 1}/${Math.ceil(habits.length / maxConcurrent)}`);
    
    const batchPromises = batch.map(async (habit) => {
      try {
        const habitResult = await processHabitImages(habit, userId);
        
        results.habitResults.push(habitResult);
        results.habitsProcessed++;
        results.totalDownloadsNeeded += habitResult.downloadsNeeded || 0;
        results.totalDownloadsCompleted += habitResult.downloadsCompleted || 0;
        results.totalDownloadsSkipped += habitResult.downloadsSkipped || 0;
        results.totalDownloadsFailed += habitResult.downloadsFailed || 0;
        
        return habitResult;
      } catch (error) {
        console.error(`❌ Batch processing error for habit ${habit.id}:`, error);
        results.errors.push({
          habitId: habit.id,
          error: error.message
        });
        return {
          habitId: habit.id,
          processed: false,
          error: error.message
        };
      }
    });
    
    // Wait for current batch to complete
    await Promise.all(batchPromises);
    
    // Add delay between batches (except for the last batch)
    if (i + maxConcurrent < habits.length && delayBetween > 0) {
      console.log(`⏳ Waiting ${delayBetween}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, delayBetween));
    }
  }
  
  console.log(`🎉 Batch processing complete!`);
  console.log(`📊 Summary: ${results.habitsProcessed} habits processed`);
  console.log(`📥 Downloads: ${results.totalDownloadsCompleted} completed, ${results.totalDownloadsSkipped} skipped, ${results.totalDownloadsFailed} failed`);
  
  return results;
}

/**
 * Checks if a photo is already cached locally
 * @param {string} photoId - The photo ID to check
 * @returns {Promise<boolean>} - True if photo exists locally
 */
export async function isPhotoCached(photoId) {
  try {
    const photo = await db.photos.where('id').equals(photoId).first();
    return !!photo;
  } catch (error) {
    console.error('Error checking photo cache:', error);
    return false;
  }
}

/**
 * Gets cached photo blob URL for display
 * @param {string} photoId - The photo ID
 * @returns {Promise<string|null>} - Blob URL or null if not found
 */
export async function getPhotoBlobUrl(photoId) {
  try {
    const photo = await db.photos.where('id').equals(photoId).first();
    if (photo && photo.blob) {
      return URL.createObjectURL(photo.blob);
    }
    return null;
  } catch (error) {
    console.error('Error getting photo blob URL:', error);
    return null;
  }
}

/**
 * Cleanup utility to revoke blob URLs when no longer needed
 * @param {string} blobUrl - The blob URL to revoke
 */
export function revokeBlobUrl(blobUrl) {
  if (blobUrl && blobUrl.startsWith('blob:')) {
    URL.revokeObjectURL(blobUrl);
  }
}
