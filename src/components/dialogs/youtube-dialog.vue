<template>
  <div
    v-if="dialogStore.isVisible && dialogStore.dialogType === 'youtube-dialog'"
    class="p-4 fixed inset-0 z-30 bg-gray-600 bg-opacity-50 flex items-center justify-center"
    @click.self="closeDialog"
  >
    <div class="flex flex-col bg-white rounded-lg shadow-lg max-w-md w-full p-2 relative space-y-4">
      <!-- Header -->
      <div class="flex justify-between items-center px-2 pt-2">
        <h2 class="text-lg font-semibold text-gray-950">
          <i class="fa-brands fa-youtube text-xl" style="color: #ff0000;"></i> YouTube
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
            placeholder="Search YouTube or paste URL"
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
            v-for="result in searchResults"
            :key="result.id.videoId"
            class="flex items-start p-2 border-b cursor-pointer hover:bg-gray-100 transition duration-150 ease-in-out"
          >
            <div class="relative mr-3 flex-shrink-0"
            @click="openLink(result)">
              <img
                :src="result.snippet.thumbnails.medium.url"
                :alt="result.snippet.title"
                class="object-cover rounded w-28 h-16 md:w-32 md:h-18"
              />
              <span class="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                {{ formatDuration(result.contentDetails?.duration) }}
              </span>
            </div>
            <div class="flex-grow min-w-0"
            @click="openLink(result)">
              <p class="font-semibold text-sm leading-tight mb-1 truncate">{{ decodeHtmlEntities(result.snippet.title) }}</p>
              <p class="text-xs text-gray-600 mb-1">{{ result.snippet.channelTitle }}</p>
              <div class="flex items-center text-xs text-gray-500">
                <span>{{ formatViews(result.statistics?.viewCount) }} views</span>
                <span class="mx-1">•</span>
                <span>{{ formatRelativeTime(result.snippet.publishedAt) }}</span>
              </div>
            </div>

            <button class="material-icons rounded-full text-white ml-2" 
            style="color: #ff0000;"
            @click="addLink(result)">add_circle</button>
          </li>
        </ul>

        <!-- Pagination Controls -->
        <div v-if="searchResults.length" class="flex justify-between items-center">
          <button
            :disabled="!prevPageToken"
            @click="fetchYouTubeResults(prevPageToken)"
            class="material-icons py-2 px-4 rounded disabled:opacity-50"
          >
            chevron_left
          </button>
          <button
            :disabled="!nextPageToken"
            @click="fetchYouTubeResults(nextPageToken)"
            class="material-icons py-2 px-4 rounded disabled:opacity-50"
          >
            chevron_right
          </button>
        </div>
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
      nextPageToken: null,
      prevPageToken: null,
      apiKey: "AIzaSyCEryS4jb4PmQPpsC_tANFN1uFFZMqt9BI",
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
    async fetchYouTubeResults(pageToken = null) {
      if (!this.searchQuery.trim()) {
        this.searchResults = [];
        this.nextPageToken = null;
        this.prevPageToken = null;
        return;
      }

      try {
        // Ensure pageToken is a string
        if (pageToken && typeof pageToken !== "string") {
          pageToken = null;
        }

        // Check if searchQuery is a YouTube URL
        const urlMatch = this.searchQuery.match(
          /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/]+\/[^/]+|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
        );

        if (urlMatch) {
          const videoId = urlMatch[1];
          const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${this.apiKey}`
          );
          const data = await response.json();
          console.log(data.items)
          this.searchResults = data.items || [];
          return
        }

        const baseUrl = 'https://www.googleapis.com/youtube/v3/search';
        const params = new URLSearchParams({
          part: "snippet",
          q: this.searchQuery.trim(),
          type: "video",
          maxResults: "5",
          key: this.apiKey,
        });

        if (pageToken) {
          console.log("Fetching YouTube results with pageToken:", pageToken);
          params.append("pageToken", pageToken);
        }

        const response = await fetch(`${baseUrl}?${params.toString()}`);
        const data = await response.json();

        if (data.error) {
          console.error("YouTube API error:", data.error);
          if (data.error.code === 403) {
            this.$toast.error({
              message: 'API quota exceeded. Please try again later.',
              duration: 2000
            });
          }
          return;
        }
        
        this.nextPageToken = data.nextPageToken || null;
        this.prevPageToken = data.prevPageToken || null;

        // Fetch statistics and duration for each video
        const videoIds = data.items.map((item) => item.id.videoId);
        const videoDetails = await this.fetchVideoDetails(videoIds);
        console.log(data.items)
        // Merge video details into search results
        this.searchResults = data.items.map((item) => {
          const details = videoDetails.find((video) => video.id === item.id.videoId) || {};
          return {
            ...item,
            contentDetails: details.contentDetails,
            statistics: details.statistics,
          };
        });
      } catch (error) {
        console.error("Error fetching YouTube data:", error);
      }
    },
    async fetchVideoDetails(videoIds) {
      const baseUrl = `https://www.googleapis.com/youtube/v3/videos`;
      const params = new URLSearchParams({
        part: "statistics,contentDetails",
        id: videoIds.join(","),
        key: this.apiKey,
      });

      const response = await fetch(`${baseUrl}?${params.toString()}`);
      const data = await response.json();
      if (data.error) {
        console.error("YouTube API error:", data.error);
        return [];
      }
      return data.items;
    },
    debounce(func, delay) {
      let timeout;
      return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
      };
    },
    addLink(video) {
      let link = '';
      if (!video.id.videoId){
        link = `https://www.youtube.com/watch?v=${video.id}`
      } else {
        link = `https://www.youtube.com/watch?v=${video.id.videoId}`
      }
      console.log(video)
      this.$emit("add-link", video);
      this.closeDialog();
    },
    openLink(video) {
      let link = '';
      if (!video.id.videoId){
        link = `https://www.youtube.com/watch?v=${video.id}`
      } else {
        link = `https://www.youtube.com/watch?v=${video.id.videoId}`
      }
      window.open(link, '_blank');
    },
    decodeHtmlEntities(text) {
      const txt = document.createElement("textarea");
      txt.innerHTML = text;
      return txt.value;
    },
    formatDuration(duration) {
      if (!duration) return "";
      const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
      const hours = (match[1] || "").replace("H", "") || 0;
      const minutes = (match[2] || "").replace("M", "") || 0;
      const seconds = (match[3] || "").replace("S", "") || 0;

      const formattedMinutes = hours ? String(minutes).padStart(2, "0") : minutes;
      const formattedSeconds = String(seconds).padStart(2, "0");

      return hours
        ? `${hours}:${formattedMinutes}:${formattedSeconds}`
        : `${formattedMinutes}:${formattedSeconds}`;
    },
    formatViews(viewCount) {
      if (!viewCount) return "0";
      return new Intl.NumberFormat("en-US", { notation: "compact", compactDisplay: "short" }).format(viewCount);
    },
    formatRelativeTime(date) {
      const now = new Date();
      const uploadDate = new Date(date);
      const diffInSeconds = Math.floor((now - uploadDate) / 1000);

      const intervals = [
        { label: "year", seconds: 31536000 },
        { label: "month", seconds: 2592000 },
        { label: "week", seconds: 604800 },
        { label: "day", seconds: 86400 },
        { label: "hour", seconds: 3600 },
        { label: "minute", seconds: 60 },
        { label: "second", seconds: 1 },
      ];

      for (let i = 0; i < intervals.length; i++) {
        const interval = intervals[i];
        const count = Math.floor(diffInSeconds / interval.seconds);
        if (count >= 1) {
          return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
        }
      }

      return "Just now";
    },
    goToNextPage() {
      if (this.nextPageToken) {
        this.fetchYouTubeResults(this.nextPageToken);
      }
    },
    goToPreviousPage() {
      if (this.prevPageToken) {
        this.fetchYouTubeResults(this.prevPageToken);
      }
    },
  },
  created() {
    this.debouncedSearch = this.debounce(this.fetchYouTubeResults, 500);
  },
};
</script>