/**
 * Image Data Standardizer - Phase 3.1
 * 
 * This utility handles the migration from legacy Firestore imageUrls (Array of Strings)
 * to the new IndexedDB imageUrls (Array of Objects) format.
 */

import { db } from '../db.js';

/**
 * Generates a consistent ID for a given URL
 * Uses a simple hash function to ensure the same URL always gets the same ID
 * @param {string} url - The URL to generate an ID for
 * @returns {string} - A consistent UUID for the URL
 */
function generateConsistentId(url) {
  // Simple deterministic hash function
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to hex and format as UUID-like string (deterministic)
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  return `legacy-${hexHash}-${hexHash.repeat(1.5).slice(0, 12)}`; // Deterministic suffix
}

/**
 * Extracts filename from URL
 * @param {string} url - The URL to extract filename from
 * @returns {string} - The extracted filename
 */
function extractFilename(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const segments = pathname.split('/');
    return segments[segments.length - 1] || 'image.jpg';
  } catch {
    // Fallback for malformed URLs
    const segments = url.split('/');
    return segments[segments.length - 1] || 'image.jpg';
  }
}

/**
 * Checks if a photo exists in the local photos table
 * @param {string} photoId - The photo ID to check
 * @returns {Promise<boolean>} - True if photo exists locally
 */
async function checkPhotoExistsLocally(photoId) {
  try {
    const photo = await db.photos.where('id').equals(photoId).first();
    return !!photo;
  } catch (error) {
    console.error('Error checking photo existence:', error);
    return false;
  }
}

/**
 * Standardizes image data for a habit
 * Detects legacy vs new format and prepares for migration
 * @param {Object} habit - The habit object containing imageUrls
 * @returns {Promise<Object>} - Standardized image data with migration info
 */
export async function standardizeImageData(habit) {
  const result = {
    habit,
    isLegacy: false,
    needsMigration: false,
    standardizedImageUrls: [],
    migrationPlan: []
  };

  // Check if imageUrls exists
  if (!habit.imageUrls || habit.imageUrls.length === 0) {
    return result;
  }

  // Determine if this is legacy format (strings) or new format (objects)
  const firstItem = habit.imageUrls[0];
  const isLegacyFormat = typeof firstItem === 'string';

  result.isLegacy = isLegacyFormat;

  if (isLegacyFormat) {
    // Legacy format: Array of strings
    let allPhotosAlreadyCached = true;
    
    for (const urlString of habit.imageUrls) {
      const photoId = generateConsistentId(urlString);
      const filename = extractFilename(urlString);
      
      const photoExistsLocally = await checkPhotoExistsLocally(photoId);
      
      // Create standardized object
      const standardizedPhoto = {
        id: photoId,
        fileName: filename,
        originalUrl: urlString,
        isLocallyCached: photoExistsLocally,
        needsDownload: !photoExistsLocally
      };
      
      result.standardizedImageUrls.push(standardizedPhoto);
      
      // Only add to migration plan if photo doesn't exist locally
      if (!photoExistsLocally) {
        allPhotosAlreadyCached = false;
        result.migrationPlan.push({
          photoId,
          urlString,
          filename,
          action: 'download_and_cache'
        });
      }
    }
    
    // Only set needsMigration to true if we actually need to download something
    // OR if the migration flag hasn't been set yet (to handle completed migrations)
    result.needsMigration = result.migrationPlan.length > 0 || !habit.localMigrationComplete;
    
    // If all photos are already cached, we can consider this migrated
    if (allPhotosAlreadyCached && !habit.localMigrationComplete) {
      console.log(`✅ All photos already cached for habit ${habit.name}, marking as migrated`);
      result.needsMigration = false; // No download needed, just flag update
    }
  } else {
    // New format: Array of objects
    for (const photoObj of habit.imageUrls) {
      if (!photoObj.id) {
        console.warn('Photo object missing ID:', photoObj);
        continue;
      }
      
      const photoExistsLocally = await checkPhotoExistsLocally(photoObj.id);
      
      const standardizedPhoto = {
        id: photoObj.id,
        fileName: photoObj.fileName || 'image.jpg',
        isLocallyCached: photoExistsLocally,
        needsDownload: !photoExistsLocally
      };
      
      // Add original URL if available (for backwards compatibility)
      if (photoObj.url) {
        standardizedPhoto.originalUrl = photoObj.url;
      }
      
      result.standardizedImageUrls.push(standardizedPhoto);
      
      if (!photoExistsLocally && photoObj.url) {
        result.migrationPlan.push({
          photoId: photoObj.id,
          urlString: photoObj.url,
          filename: photoObj.fileName,
          action: 'download_and_cache'
        });
      }
    }
    
    // For new format, only need migration if there are missing photos
    result.needsMigration = result.migrationPlan.length > 0;
  }

  return result;
}

/**
 * Updates a habit's imageUrls to the new format
 * @param {string} habitId - The habit ID to update
 * @param {Array} standardizedImageUrls - The standardized image URLs
 * @returns {Promise<boolean>} - True if update was successful
 */
export async function updateHabitToNewFormat(habitId, standardizedImageUrls) {
  try {
    // Convert to new format (array of objects without blob data)
    const newImageUrls = standardizedImageUrls.map(photo => ({
      id: photo.id,
      fileName: photo.fileName
    }));
    
    await db.habits.update(habitId, {
      imageUrls: newImageUrls,
      localMigrationComplete: true,
      updatedAt: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating habit to new format:', error);
    return false;
  }
}

/**
 * Checks if a habit has completed local migration
 * @param {Object} habit - The habit object to check
 * @returns {boolean} - True if migration is complete
 */
export function isMigrationComplete(habit) {
  return habit.localMigrationComplete === true;
}

// Export utilities for testing
export { generateConsistentId, extractFilename, checkPhotoExistsLocally };
