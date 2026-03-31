import { defineStore } from 'pinia';
import { db } from '../db.js';

export const usePhotoCacheStore = defineStore('photoCacheStore', {
  state: () => ({
    cachedPhotos: new Map(), // habitId -> photos[]
    tempBlobUrls: new Map(), // photoId -> blobUrl for cleanup
  }),

  actions: {
    addPhotos(habitId, photos) {
      if (!this.cachedPhotos.has(habitId)) {
        this.cachedPhotos.set(habitId, []);
      }
      
      const photosWithIds = photos.map(photo => ({
        id: crypto.randomUUID(),
        file: photo,
        fileName: photo.name,
        fileSize: photo.size,
        mimeType: photo.type,
        timestamp: new Date(),
        blobUrl: URL.createObjectURL(photo)
      }));
      
      this.cachedPhotos.get(habitId).push(...photosWithIds);
      
      // Track blob URLs for cleanup
      photosWithIds.forEach(photo => {
        this.tempBlobUrls.set(photo.id, photo.blobUrl);
      });
      
      return photosWithIds;
    },

    getPhotos(habitId) {
      return this.cachedPhotos.get(habitId) || [];
    },

    removePhoto(habitId, photoId) {
      const photos = this.cachedPhotos.get(habitId);
      if (photos) {
        const index = photos.findIndex(p => p.id === photoId);
        if (index !== -1) {
          // Clean up blob URL
          URL.revokeObjectURL(photos[index].blobUrl);
          this.tempBlobUrls.delete(photoId);
          
          photos.splice(index, 1);
          
          if (photos.length === 0) {
            this.cachedPhotos.delete(habitId);
          }
        }
      }
    },

    clearHabitPhotos(habitId) {
      const photos = this.cachedPhotos.get(habitId);
      if (photos) {
        // Clean up all blob URLs
        photos.forEach(photo => {
          URL.revokeObjectURL(photo.blobUrl);
          this.tempBlobUrls.delete(photo.id);
        });
        this.cachedPhotos.delete(habitId);
      }
    },

    async saveToDatabase(habitId, userId) {
      const photos = this.cachedPhotos.get(habitId);
      if (!photos || photos.length === 0) return [];

      const savedPhotos = [];
      
      for (const photo of photos) {
        try {
          await db.photos.add({
            id: photo.id,
            habitId,
            userId,
            blob: photo.file,
            fileName: photo.fileName,
            fileSize: photo.fileSize,
            mimeType: photo.mimeType,
            syncStatus: 'pending',
            timestamp: photo.timestamp,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          savedPhotos.push({
            id: photo.id,
            fileName: photo.fileName
          });
        } catch (error) {
          console.error('Error saving photo to database:', error);
          throw error;
        }
      }
      
      // Clear cache after successful save
      this.clearHabitPhotos(habitId);
      
      return savedPhotos;
    },

    // Cleanup method for when user navigates away
    cleanup() {
      // Clean up all blob URLs
      this.tempBlobUrls.forEach(url => URL.revokeObjectURL(url));
      this.tempBlobUrls.clear();
      this.cachedPhotos.clear();
    }
  }
});
