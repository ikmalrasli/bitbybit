<template>
  <div v-if="sunnah" class="w-full h-full flex flex-col relative overflow-hidden">
    <!-- Header -->
    <header class="h-14 bg-white p-4 flex flex-row flex-shrink-0">
      <button @click="goBack" class="material-icons">chevron_left</button>
      <h1 class="text-lg text-black font-bold truncate w-full text-center">
        {{formatTitle(sunnah.name)}}</h1>
    </header>
    
    <!-- Content -->
    <div class="h-96 flex-grow overflow-y-auto scrollbar-hide p-4 pb-20">
      <!-- Media Section -->
      <div v-if="sunnah && hasMedia" class="mb-4 space-y-4">
        <!-- Images -->
        <div v-if="sunnah.imageUrls && sunnah.imageUrls.length > 0" class="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div v-for="(imageUrl, index) in sunnah.imageUrls" :key="index" 
               class="relative bg-gray-100 rounded-md overflow-hidden border">
            <img :src="imageUrl" :alt="`Sunnah image ${index + 1}`"
                 class="w-full object-cover" style="aspect-ratio: 1 / 1;" />
          </div>
        </div>

        <!-- YouTube Videos -->
        <div v-if="sunnah.youtubeUrls && sunnah.youtubeUrls.length > 0" class="space-y-2">
          <div v-for="(video, index) in sunnah.youtubeUrls" :key="index"
               class="flex items-center border rounded-md p-2">
            <i class="fa-brands fa-youtube text-xl mx-2" style="color: #ff0000;"></i>
            <a :href="video.url" target="_blank" class="flex-grow hover:underline">
              <span class="block truncate font-medium">{{ video.title }}</span>
              <span class="block text-sm text-gray-600">{{ video.channel }}</span>
            </a>
          </div>
        </div>

        <!-- Spotify Tracks -->
        <div v-if="sunnah.spotifyUrls && sunnah.spotifyUrls.length > 0" class="space-y-2">
          <div v-for="(track, index) in sunnah.spotifyUrls" :key="index"
               class="flex items-center border rounded-md p-2">
            <i class="fa-brands fa-spotify text-xl mx-2" style="color: #1DB954;"></i>
            <a :href="track.url" target="_blank" class="flex-grow hover:underline">
              <span class="block truncate font-medium">{{ track.title }}</span>
              <span class="block text-sm text-gray-600">{{ track.artist }}</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div v-if="sunnah" class="space-y-4">
        <!-- Notes -->
        <div v-if="sunnah.notes" class="bg-gray-50 p-3 rounded-md">
          <h3 class="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
          <p class="text-sm text-gray-600 whitespace-pre-wrap">{{ sunnah.notes }}</p>
        </div>
        
        <!-- Description -->
        <div style="white-space: pre-wrap;">{{ sunnah.description }}</div>
      </div>
    </div>

    <!-- Create Button -->
    <div class="px-4 py-2 flex-shrink-0 absolute bottom-0 w-full">
      <button @click="addToHabits" 
      class="w-full bg-violet-400 text-white font-bold py-3 rounded-full shadow-lg hover:bg-violet-500">
        Add to habits
      </button>
    </div>
    
  </div>
</template>

<script>
import { useSunnahStore } from '../../store/sunnahStore';

export default {
  data() {
    return {
      sunnah: null,
      sunnahStore: useSunnahStore(),
    };
  },
  computed: {
    allSunnahs() {
      return this.sunnahStore.allSunnahs;
    },
    hasMedia() {
      if (!this.sunnah) return false;
      return (
        (this.sunnah.imageUrls && this.sunnah.imageUrls.length > 0) ||
        (this.sunnah.youtubeUrls && this.sunnah.youtubeUrls.length > 0) ||
        (this.sunnah.spotifyUrls && this.sunnah.spotifyUrls.length > 0)
      );
    }
  },
  methods: {
    formatTitle(title) {
      const maxLength = 30; // Maximum length before truncating
      if (title.length > maxLength) {
        return `${title.substring(0, maxLength)}...`; // Truncate and append ellipsis
      }
      
      return title; // Return original file name if it's within limit
    },
    fetchSunnahDetail() {
      const sunnahId = this.$route.params.sunnahId;
      this.sunnah = this.allSunnahs.find(sunnah => sunnah.sunnahId === sunnahId);
    },
    goBack() {
      this.$router.push('/sunnahs');
    },
    addToHabits() {
      this.sunnahStore.setSelectedSunnah(this.sunnah);
      this.$router.push({
        name: 'add-sunnah',  // Assuming this is the name of the route
        params: {
          sunnahId: this.sunnah.sunnahId
        }
      });
    }
  },
  watch: {
    '$route.params.sunnahId': 'fetchSunnahDetail'
  },
  mounted() {
    this.fetchSunnahDetail();
  }
};
</script>
