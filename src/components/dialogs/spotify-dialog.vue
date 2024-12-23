<template>
  <div
    v-if="dialogStore.isVisible && dialogStore.dialogType === 'spotify-dialog'"
    class="p-4 fixed inset-0 z-40 bg-gray-600 bg-opacity-50 flex items-center justify-center"
    @click.self="closeDialog"
  >
    <div class="flex flex-col bg-white rounded-lg shadow-lg max-w-md w-full p-2 relative space-y-4">
      <!-- Header -->
      <div class="flex justify-between items-center px-2 pt-2">
        <h2 class="text-lg font-semibold text-gray-950">
          <i class="fa-brands fa-spotify text-xl" style="color: #1DB954;"></i> Spotify
        </h2>

        <div class="flex space-x-4 items-center">
          <span class="material-icons cursor-pointer" @click="closeDialog">close</span>
        </div>
      </div>

      <!-- Content -->
      <div class="flex flex-col">
        <!-- Search Input -->
        <div class="relative mb-4">
          <input
            type="text"
            v-model="searchQuery"
            @input="debouncedSearch"
            placeholder="Search Spotify for tracks"
            class="w-full py-2 px-4 border rounded-full pr-10"
          />
          
          <!-- Clear Button (X) inside the search bar -->
          <button
            v-if="searchQuery.trim()"
            @click="clearSearchQuery"
            class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pt-2"
          >
            <i class="material-icons">cancel</i>
          </button>
        </div>

        <!-- Results -->
        <ul v-if="searchResults.length" class="overflow-y-auto flex-grow">
          <li
            v-for="track in searchResults"
            :key="track.id"
            class="flex items-center p-2 border-b cursor-pointer hover:bg-gray-100 transition duration-150 ease-in-out"
            
          >
            <div class="relative mr-3 flex-shrink-0"
            @click="openLink(track)">
              <img
                :src="track.album.images[1]?.url || track.album.images[0]?.url"
                :alt="track.name"
                class="w-16 h-16 object-cover rounded"
              />
            </div>
            <div class="flex-grow min-w-0"
            @click="openLink(track)">
              <p class="font-semibold text-sm leading-tight mb-1 truncate">{{ track.name }}</p>
              <p class="text-xs text-gray-600 mb-1">{{ track.artists[0].name }}</p>
              <div class="flex items-center text-xs text-gray-500">
                <span class="truncate">{{ track.album.name }}</span>
                <span class="mx-1">•</span>
                <span>{{ formatDuration(track.duration_ms) }}</span>
              </div>
            </div>

            <button class="material-icons rounded-full text-white ml-2" 
            style="color: #1DB954;"
            @click="addLink(track)">add_circle</button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { useDialogStore } from "../../store/dialogStore";

export default {
  data() {
    return {
      dialogStore: useDialogStore(),
      searchQuery: "",
      searchResults: [],
      spotifyToken: null,
    };
  },
  methods: {
    closeDialog() {
      this.clearSearchQuery();
      this.dialogStore.closeDialog();
    },
    clearSearchQuery() {
      this.searchQuery = "";
      this.searchResults = [];
    },
    async fetchSpotifyToken() {
      try {
        const clientId = "80e45e8878474063a8bd1b87e23e6486";
        const clientSecret = "c933edfa2fc04400a74a7bf5b03e4645";
        const response = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
          },
          body: "grant_type=client_credentials",
        });
        const data = await response.json();
        this.spotifyToken = data.access_token;
      } catch (error) {
        console.error("Error fetching Spotify token:", error);
      }
    },
    async fetchSpotifyResults() {
      if (!this.searchQuery.trim() || !this.spotifyToken) {
        this.searchResults = [];
        return;
      }

      try {
        const response = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(
            this.searchQuery
          )}&type=track&limit=5`,
          {
            headers: {
              Authorization: `Bearer ${this.spotifyToken}`,
            },
          }
        );
        const data = await response.json();
        this.searchResults = data.tracks.items || [];
      } catch (error) {
        console.error("Error fetching Spotify data:", error);
      }
    },
    addLink(track) {
      this.$emit("add-link", track);
      this.closeDialog();
    },
    openLink(track) {
      const link = track.external_urls.spotify
      window.open(link, '_blank');
    },
    debounce(func, delay) {
      let timeout;
      return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
      };
    },
    formatDuration(durationMs) {
      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.floor((durationMs % 60000) / 1000);
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    },
  },
  async created() {
    this.debouncedSearch = this.debounce(this.fetchSpotifyResults, 500);
    await this.fetchSpotifyToken();
  },
};
</script>
