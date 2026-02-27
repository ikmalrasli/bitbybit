<template>
  <div class="w-full h-full flex flex-col bg-white overflow-hidden">
    <!-- Full-Screen Image Modal -->
    <div v-if="isImgFullscreen" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      @click.self="closeImgFullscreen">
      <!-- Full-Screen Image -->
      <div class="relative">
        <img :src="fullscreenImageUrl" alt="Full-Screen Image" class="object-contain max-h-full max-w-full"
          :style="{ transform: `scale(${imageScale})` }" />
        <span v-if="imageUrls.length > 1"
          class="absolute top-2 right-2 text-xs rounded-full bg-black bg-opacity-60 text-white px-1">
          {{ currentImageIndex + 1 }}/{{ imageUrls.length }}</span>
      </div>


      <!-- Navigation Buttons -->
      <button v-if="currentImageIndex > 0" @click="prevImage"
        class="absolute left-4 top-1/2 transform -translate-y-1/2 text-white material-icons bg-black bg-opacity-60 rounded-full">chevron_left</button>
      <button v-if="currentImageIndex < imageUrls.length - 1" @click="nextImage"
        class="absolute right-4 top-1/2 transform -translate-y-1/2 text-white material-icons bg-black bg-opacity-60 rounded-full">chevron_right</button>

      <!-- Zoom Controls -->
      <div class="flex mt-4 space-x-4 absolute top-4 right-4">
        <button @click="zoomIn" class="text-white material-icons">zoom_in</button>
        <button @click="zoomOut" class="text-white material-icons">zoom_out</button>
        <button @click="closeImgFullscreen" class="text-white material-icons">close</button>
      </div>
    </div>
    <!-- Header -->
    <header class="w-full bg-white p-4 flex flex-row relative justify-between z-40">
      <button @click="goBack" class="material-icons rounded-full active:bg-gray-200">chevron_left</button>
      <h1 class="px-4 text-xl text-black font-bold truncate max-w-xs whitespace-nowrap overflow-hidden">
        {{ selectedHabit?.name || 'Habit Details' }}</h1>

      <!-- More Options Button (Dropdown Toggle) -->
      <div class="relative">
        <!-- Dropdown Toggle Button -->
        <button @click="toggleDropdown" class="material-icons rounded-full active:bg-gray-200">more_horiz</button>

        <!-- Dropdown Menu -->
        <div v-if="isDropdownOpen"
          class="absolute right-0 z-50 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200" @click.stop>
          <ul class="py-1 text-gray-700">
            <div v-if="!isPaused">
              <li @click="pauseOption"
                class="grid grid-cols-[auto,1fr] items-center px-4 py-2 text-md hover:bg-gray-100 cursor-pointer">
                <span class="material-icons">pause</span>
                <span class="text-center w-full">Pause habit</span>
              </li>
            </div>
            <div v-else>
              <li @click="resumeOption"
                class="grid grid-cols-[auto,1fr] items-center px-4 py-2 text-md hover:bg-gray-100 cursor-pointer">
                <span class="material-icons">play_arrow</span>
                <span class="text-center w-full">Resume habit</span>
              </li>
            </div>

            <li @click="editOption"
              class="grid grid-cols-[auto,1fr] items-center px-4 py-2 text-md hover:bg-gray-100 cursor-pointer">
              <span class="material-icons">edit</span>
              <span class="text-center w-full">Edit habit</span>
            </li>
            <li @click="deleteOption"
              class="grid grid-cols-[auto,1fr] items-center px-4 py-2 text-md text-red-500 hover:bg-gray-100 cursor-pointer">
              <span class="material-icons">delete</span>
              <span class="text-center w-full">Delete habit</span>
            </li>
          </ul>
        </div>
      </div>
    </header>

    <div class="h-96 flex-grow overflow-y-auto px-4 space-y-2 pb-4 scrollbar-hide w-full"
      :class="[isImgFullscreen ? 'overflow-hidden' : '']">
      <!-- Progress Card -->
      <div class="w-full p-4 text-gray-700 bg-white border rounded-lg text-center">
        <div v-if="isPaused" class="border-b border-gray-200 pb-4 mb-4">
          <h2 class="flex-auto text-xl block mb-2">{{ selectedHabit?.name }} is paused</h2>
          <h1 class="flex-auto text-5xl material-icons">pause</h1>
        </div>
        <div :class="[isPaused ? 'opacity-50' : '']">
          <h2 class="flex-auto text-xl block mb-2">Progress</h2>
          <h1 class="flex-auto text-5xl">{{ addProgress }}</h1>
          <h2 class="flex-auto text-xl mb-2">/ {{ selectedHabit?.dailyGoal }}</h2>
        </div>

        <div class="w-full justify-center flex">
          <!-- Minus Button -->
          <button type="button" @click="decreaseGoal"
            class="material-icons p-1 text-gray-700 rounded-full active:bg-gray-200 disabled:text-gray-400"
            :disabled="isPaused">remove</button>

          <!-- Slider -->
          <input v-if="selectedHabit" type="range" :min="0" :max="selectedHabit.dailyGoal" v-model.number="addProgress"
            class="range w-1/2 mx-2"
            :class="[selectedHabit.color ? `accent-${selectedHabit.color.default}` : 'accent-violet-400']"
            :disabled="isPaused" />

          <!-- Plus Button -->
          <button type="button" @click="increaseGoal"
            class="material-icons p-1 text-gray-700 rounded-full active:bg-gray-200 disabled:text-gray-400"
            :disabled="isPaused">add</button>
        </div>

        <!-- Reset Progress Button -->
        <button type="button" @click="removeTodayEntries"
          class="material-icons textpausegray-700 mt-4 mr-2 p-1 rounded-full active:bg-gray-200 disabled:text-gray-400"
          :disabled="isPaused">replay</button>
        <!-- Add Progress Button-->
        <button type="button" @click="confirmProgress"
          class="material-icons font-semibold mt-4 ml-2 p-1 rounded-full active:bg-gray-200 disabled:text-gray-400 disabled:font-normal"
          :class="selectedHabit?.color ? `text-${selectedHabit?.color.default}` : 'text-violet-400'"
          :disabled="addProgress == selectedHabit?.progress || loading || isPaused">
          <template v-if="loading">
            <!-- Circular Loading Indicator -->
            <span class="loader"></span>
          </template>
          <template v-else>
            check
          </template>
        </button>
      </div>

      <!-- Notes and Image -->
      <div v-if="selectedHabit?.notes || selectedHabit?.imageUrl ||
        selectedHabit?.imageUrls?.length > 0 || selectedHabit?.youtubeUrls?.length > 0 ||
        selectedHabit?.spotifyUrls?.length > 0"
        class="w-full p-4 text-gray-700 bg-white border rounded-lg space-y-2 overflow-hidden">
        <h2 class="text-lg text-center block mb-2">Notes</h2>
        <p v-if="selectedHabit?.notes" class="leading-tight py-2" style="white-space: pre-wrap;"
          v-html="processedNotes"></p>

        <!-- Photo Gallery -->
        <div v-if="selectedHabit?.imageUrls?.length > 0" class="w-full text-gray-700 bg-white">
          <div class="snap-x snap-mandatory flex overflow-x-auto md:overflow-x-scroll" style="scrollbar-width: thin;"
            ref="gallery">
            <div v-for="(imageUrl, index) in imageUrls" :key="index"
              class="flex relative image-wrapper snap-center flex-shrink-0 w-full">
              <img :src="imageUrl" :alt="`Image ${index + 1}`"
                class="flex flex-grow w-full object-cover rounded-lg border cursor-pointer transition-transform duration-300 ease-in-out"
                @click="openImgFullscreen2(imageUrl)" />
              <span v-if="imageUrls.length > 1"
                class="absolute top-2 right-2 text-xs rounded-full bg-black bg-opacity-30 text-white px-1">
                {{ index + 1 }}/{{ imageUrls.length }}</span>
            </div>
          </div>
        </div>

        <!-- Youtube Urls -->
        <div v-if="selectedHabit?.youtubeUrls?.length > 0" class="w-full space-y-2">
          <div v-for="(video, index) in selectedHabit.youtubeUrls" :key="index"
            class="w-full flex items-center border rounded-md text-sm p-2">
            <i class="fa-brands fa-youtube text-xl mx-2 flex-shrink-0" style="color: #ff0000;"></i>
            <div class="min-w-0 flex-1">
              <a :href="video.url" target="_blank" class="block hover:underline">
                <div class="truncate">{{ video.title }}</div>
                <div class="text-xs truncate">{{ video.channel }}</div>
              </a>
            </div>
          </div>
        </div>

        <!-- Spotify Urls -->
        <div v-if="selectedHabit?.spotifyUrls?.length > 0" class="w-full space-y-2">
          <div v-for="(track, index) in selectedHabit.spotifyUrls" :key="index"
            class="w-full flex items-center border rounded-md text-sm p-2">
            <i class="fa-brands fa-spotify text-xl mx-2 flex-shrink-0" style="color: #1DB954;"></i>
            <div class="min-w-0 flex-1">
              <a :href="track.url" target="_blank" class="block hover:underline">
                <div class="truncate">track.title</div>
                <div class="text-xs truncate">{{ track.artist }}</div>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Reminders Card -->
      <div v-if="selectedHabit?.reminders?.length > 0"
        class="w-full items-center flex p-4 px-4 text-gray-700 bg-white border rounded-lg">
        <h2 class="text-lg text-center block mr-4">Reminders:</h2>
        <div class="flex flex-row justify-center space-x-2 items-center">
          <div v-for="reminder in selectedHabit.reminders" :key="reminder.id">
            <span
              class="min-w-24 text-center text-sm text-nowrap font-medium text-black text-opacity-50 rounded-full py-0.5 px-2 bg-black bg-opacity-5">
              {{ convertTime(reminder) }}</span>
          </div>
        </div>
      </div>

      <!-- Timeline Card -->
      <div class="flex items-center w-full p-4 px-4 text-gray-700 bg-white border rounded-lg">
        <h2 class="text-lg text-center block mr-4">Term:</h2>
        <div class="flex flex-grow flex-row justify-between space-x-2 items-center">
          <span
            class="min-w-24 text-center text-sm text-nowrap font-medium text-black text-opacity-50 rounded-full py-0.5 px-2 bg-black bg-opacity-5">
            {{ habitTermStart.toLocaleDateString('en-UK', { day: 'numeric', month: 'short', year: 'numeric' }) }}
          </span>
          <hr class="flex-grow border-t mx-2"
            :class="selectedHabit?.color ? `border-${selectedHabit?.color.default}` : 'border-violet-400'" />
          <span
            class="justify-end min-w-24 text-center text-sm text-nowrap font-medium text-black text-opacity-50 rounded-full py-0.5 px-2 bg-black bg-opacity-5">
            {{ selectedHabit?.termEnd ? habitTermEnd.toLocaleDateString('en-UK', {
              day: 'numeric', month: 'short', year:
                'numeric'
            }) : 'No end' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { db as firestoreDb } from "../../firebase"; // Firestore instance (renamed)
import { db } from "../../db"; // Dexie IndexedDB
import { collection, query, where, getDocs, deleteDoc, Timestamp, addDoc, orderBy, doc, updateDoc, or, limit } from "firebase/firestore"; // Firestore methods
import { getAuth } from "firebase/auth"; // Firebase Authentication
import { useDialogStore } from '../../store/dialogStore';
import { useStatStore } from '../../store/statStore.js';
import { generateId } from "../../utils/generateId";
import { toMillis } from "../../utils/timestampUtils";
import { immediateSyncMixin } from '../../mixins/immediateSyncMixin';

export default {
  mixins: [immediateSyncMixin],
  data() {
    return {
      addProgress: 0,
      isDropdownOpen: false,
      docId: '',
      setTimestamp: new Date(),
      onTime: true,
      loading: false,
      dialogStore: useDialogStore(),
      isImgFullscreen: false,
      imageScale: 1,
      statStore: useStatStore(),
      fullscreenImageUrl: '',
      scrollTimeout: null,
      currentImageIndex: 0,
      isPaused: false,
      pauseId: '',
      pauseStart: null,
    };
  },
  computed: {
    ...mapState(['selectedHabit', 'selectedDay', 'firstFetchWeekProgress']),
    selectedHabit() {
      this.addProgress = this.$store.state.selectedHabit?.progress;
      return this.$store.state.selectedHabit;
    },
    habitTermStart() {
      return new Timestamp(this.selectedHabit?.termStart.seconds, this.selectedHabit?.termStart.nanoseconds).toDate()
    },
    habitTermEnd() {
      return new Timestamp(this.selectedHabit?.termEnd?.seconds, this.selectedHabit?.termEnd?.nanoseconds).toDate()
    },

    processedNotes() {
      if (!this.selectedHabit?.notes) return '';
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      return this.selectedHabit.notes.replace(urlRegex, (url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline">${url}</a>`;
      });
    },
    imageUrls() {
      return this.selectedHabit?.imageUrls || [];
    }
  },
  methods: {
    convertTime(time) {
      const timeParts = time.split(':');
      let hours = parseInt(timeParts[0]);
      const minutes = timeParts[1];
      let period = 'AM';

      if (hours >= 12) {
        period = 'PM';
        if (hours > 12) {
          hours -= 12;
        }
      } else if (hours === 0) {
        hours = 12;
      }

      return `${hours}:${minutes} ${period}`;
    },
    formatURLTitle(title) {
      const maxLength = 35; // Maximum length before truncating
      if (title.length > maxLength) {
        return `${title.substring(0, maxLength)}...`; // Truncate and append ellipsis
      }

      return title; // Return original file name if it's within limit
    },
    openImgFullscreen2(imageUrl) {
      this.fullscreenImageUrl = imageUrl;
      this.isImgFullscreen = true;
      this.imageScale = 1;
      this.currentImageIndex = this.imageUrls.indexOf(imageUrl);
    },
    nextImage() {
      if (this.currentImageIndex < this.imageUrls.length - 1) {
        this.currentImageIndex++;
        this.fullscreenImageUrl = this.imageUrls[this.currentImageIndex];
      }
    },
    prevImage() {
      if (this.currentImageIndex > 0) {
        this.currentImageIndex--;
        this.fullscreenImageUrl = this.imageUrls[this.currentImageIndex];
      }
    },
    handleScroll(e) {
      if (this.$refs.gallery) {
        e.preventDefault();
        const gallery = this.$refs.gallery;
        const scrollAmount = e.deltaY;
        gallery.scrollLeft += scrollAmount;

        // Snap to nearest image after scroll
        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
          const scrollLeft = gallery.scrollLeft;
          const itemWidth = gallery.offsetWidth * 0.9; // 90% of container width
          const nearestItem = Math.round(scrollLeft / itemWidth);
          gallery.scrollTo({
            left: nearestItem * itemWidth,
            behavior: 'smooth'
          });
        }, 150);
      }
    },
    openImgFullscreen() {
      this.isImgFullscreen = true;
      this.imageScale = 1;
    },
    closeImgFullscreen() {
      this.isImgFullscreen = false;
    },
    zoomIn() {
      this.imageScale += 0.1; // Increase scale by 0.1 on each click
    },
    zoomOut() {
      if (this.imageScale > 0.1) {
        this.imageScale -= 0.1; // Decrease scale by 0.1, preventing negative or zero scale
      }
    },
    // Back and Dropdown Functions
    toggleDropdown(event) {
      event.stopPropagation(); // Prevent the outside click listener from being triggered
      this.isDropdownOpen = !this.isDropdownOpen;

      // If the dropdown is open, add the click listener to detect clicks outside
      if (this.isDropdownOpen) {
        document.addEventListener('click', this.handleClickOutside);
      } else {
        document.removeEventListener('click', this.handleClickOutside);
      }
    },
    handleClickOutside(event) {
      const dropdown = this.$el.querySelector('.absolute');
      if (dropdown && !dropdown.contains(event.target)) {
        this.isDropdownOpen = false;  // Close dropdown
        document.removeEventListener('click', this.handleClickOutside); // Remove the event listener
      }
    },
    pauseOption() {
      this.pauseHabit();
      this.isDropdownOpen = false;
      document.removeEventListener('click', this.handleClickOutside);
    },
    resumeOption() {
      this.resumeHabit();
      this.isDropdownOpen = false;
      document.removeEventListener('click', this.handleClickOutside);
    },
    editOption() {
      this.editHabit();
      this.isDropdownOpen = false;
      document.removeEventListener('click', this.handleClickOutside);
    },
    deleteOption() {
      this.deleteHabit();
      this.isDropdownOpen = false;
      document.removeEventListener('click', this.handleClickOutside);
    },
    goBack() {
      setTimeout(() => {
        this.$router.push('/');
      }, 100);
    },
    // Progress Functions
    increaseGoal() {
      if (this.addProgress < this.selectedHabit.dailyGoal) {
        this.addProgress++;
      }
    },
    decreaseGoal() {
      if (this.addProgress > 0) {
        this.addProgress--;
      }
    },
    async removeTodayEntries() {
      try {
        const dayStart = new Date(this.selectedDay);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(this.selectedDay);
        dayEnd.setHours(23, 59, 59, 999);

        const habitId = this.selectedHabit.habitId;

        // Delete progress entries from Dexie for the specific day range
        await db.progress
          .where('habitId')
          .equals(habitId)
          .and(progress => {
            const timestamp = progress.timestamp;
            return timestamp >= toMillis(dayStart) && timestamp <= toMillis(dayEnd);
          })
          .delete();

        await this.immediateSync();

        this.addProgress = 0;
        this.$store.state.selectedHabit.progress = 0;
        this.docId = null;
        this.statStore.setProgressUpdated();

        // Refresh week progress from Dexie
        await this.$store.dispatch('fetchWeekProgress');

      } catch (error) {
        console.error(error);
        this.$toast.error({
          message: 'Error resetting progress. Please try again.',
          duration: 2000
        });
      }
    },
    // Habit functions
    handleSelectedHabitChange() {
      if (this.selectedDay.setHours(0, 0, 0, 0) != new Date().setHours(0, 0, 0, 0)) {
        this.setTimestamp = new Date(this.selectedDay);
        this.setTimestamp.setHours(23, 59, 59, 999);
        this.onTime = false;
      }
      this.checkProgress();
      this.checkPause();
    },
    checkPause() {
      console.log("Checking pause status for habit:", this.selectedHabit?.habitId);

      // Add this guard clause
      if (!this.selectedHabit || !this.selectedHabit.habitId) {
        this.isPaused = false;
        console.log("No selected habit, setting isPaused to false");
        return;
      }

      // Read from Dexie instead of Firestore
      db.pauses
        .where('habitId')
        .equals(this.selectedHabit.habitId)
        .toArray()
        .then((pauses) => {
          // Sort by start timestamp descending
          pauses.sort((a, b) => (b.start || 0) - (a.start || 0));

          if (pauses.length > 0 && pauses[0].end === null) {
            this.isPaused = true;
            this.pauseId = pauses[0].id;
            this.pauseStart = { seconds: Math.floor(pauses[0].start / 1000), nanoseconds: 0 };
            console.log("Habit is paused, HabitID:", this.selectedHabit.habitId);
          } else {
            this.isPaused = false;
            console.log("Habit is not paused", pauses.length > 0 ? "(end is set)" : "(never paused)");
          }
        })
        .catch((error) => {
          console.error("Error checking pause status: ", error);
        });
    },
    checkProgress() {
      if (this.selectedHabit?.progressId !== '') {
        this.docId = this.selectedHabit?.progressId;
      } else {
        this.docId = null;
      }
    },
    async createProgress() {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          throw new Error("User not authenticated. Please log in.");
        }

        this.loading = true; // Start loading

        // Generate local ID for progress entry
        const progressId = generateId();

        // Add progress to Dexie (IndexedDB)
        await db.progress.add({
          id: progressId,
          habitId: this.selectedHabit.habitId,
          progress: this.addProgress,
          timestamp: toMillis(this.setTimestamp),
          onTime: this.onTime,
          syncStatus: 'pending', // Mark for sync
          updatedAt: Date.now(), // Track modification time
        });

        this.loading = false; // End loading
        this.docId = progressId;

        // Sync to Firestore if online
        await this.immediateSync();

        if (this.addProgress === this.selectedHabit.dailyGoal) {
          this.$toast.success({
            message: 'Habit completed!',
            duration: 2000
          });
          setTimeout(() => {
            this.$router.push('/'), 1000;
          })
        } else if (this.addProgress > this.selectedHabit.progress) {
          this.$toast.info({
            message: 'Habit progress increased!',
            duration: 2000
          });
        }
        this.selectedHabit.progress = this.addProgress;

        // Refresh week progress from Dexie
        await this.$store.dispatch('fetchWeekProgress');

      } catch (error) {
        this.loading = false; // End loading on error
        console.error(error);
        this.$toast.error({
          message: 'Error. Please try again.',
          duration: 2000
        });
      }
    },
    async updateProgress() {
      if (this.docId) {
        this.loading = true; // Start loading
        try {
          // Update progress in Dexie (IndexedDB)
          await db.progress.update(this.docId, {
            progress: this.addProgress,
            timestamp: toMillis(this.setTimestamp),
            onTime: this.onTime,
            syncStatus: 'pending', // Mark for sync
            updatedAt: Date.now(), // Track modification time
          });

          this.loading = false; // End loading

          // Sync to Firestore if online
          await this.immediateSync();

          if (this.addProgress === this.selectedHabit.dailyGoal) {
            this.$toast.info({
              message: 'Habit progress increased!',
              duration: 2500
            });
          }

          this.selectedHabit.progress = this.addProgress;

          // Refresh week progress from Dexie
          await this.$store.dispatch('fetchWeekProgress');

        } catch (error) {
          this.loading = false; // End loading on error
          console.error(error);
          this.$toast.error({
            message: 'Error updating progress. Please try again.',
            duration: 2000
          });
        }
      } else {
        await this.createProgress();
      }
    },
    confirmProgress() {
      if (this.addProgress > 0) {
        this.updateProgress();
      }

      if (this.addProgress === 0) {
        this.removeTodayEntries();
      }

      this.statStore.setProgressUpdated();
    },
    pauseHabit() {
      this.dialogStore.openDialog(
        'Pause Habit',
        'Are you sure you want to pause this habit?',
        'default',
        async () => {
          try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
              throw new Error("User not authenticated. Please log in.");
            }

            // Generate local ID for pause
            const pauseId = generateId();
            const now = new Date();

            // Add pause to Dexie (IndexedDB)
            await db.pauses.add({
              id: pauseId,
              habitId: this.selectedHabit.habitId,
              start: toMillis(now),
              end: null,
              syncStatus: 'pending', // Mark for sync
              updatedAt: Date.now(), // Track modification time
            });

            this.isPaused = true;
            this.pauseId = pauseId;
            this.pauseStart = { seconds: Math.floor(toMillis(now) / 1000), nanoseconds: 0 };

            // Update the habit's isPaused flag in Dexie
            await db.habits.update(this.selectedHabit.habitId, {
              isPaused: true
            });

            console.log("Habit paused successfully");

            // Sync to Firestore if online
            await this.immediateSync();

            // Refresh the pauses and habits from Dexie
            await this.$store.dispatch('fetchPauses');
            await this.$store.dispatch('fetchHabits');

          } catch (error) {
            console.error("Error pausing habit:", error);
            this.$toast.error({
              message: 'Error pausing habit. Please try again.',
              duration: 2000
            });
          }
        }
      );
    },
    resumeHabit() {
      this.dialogStore.openDialog(
        'Resume Habit',
        'Are you sure you want to resume this habit?',
        'default',
        async () => {
          try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) {
              throw new Error("User not authenticated. Please log in.");
            }

            const now = new Date();
            if (this.pauseStart) {
              const startDate = this.pauseStart.toDate ? this.pauseStart.toDate() : new Date(this.pauseStart.seconds * 1000);
              // Compare only date part
              if (
                startDate.getFullYear() === now.getFullYear() &&
                startDate.getMonth() === now.getMonth() &&
                startDate.getDate() === now.getDate()
              ) {
                // If pausing and resuming on the same day, mark the pause record as deleted for sync
                await db.pauses.update(this.pauseId, {
                  _deleted: true,
                  syncStatus: 'pending',
                  updatedAt: Date.now(),
                });
              } else {
                // Otherwise, update the end time of the pause
                await db.pauses.update(this.pauseId, {
                  end: toMillis(now),
                  syncStatus: 'pending', // Mark for sync
                  updatedAt: Date.now(), // Track modification time
                });
              }
            }

            // Update the habit's isPaused flag in Dexie
            await db.habits.update(this.selectedHabit.habitId, {
              isPaused: false
            });

            // Reset local state
            this.isPaused = false;
            this.pauseId = null;
            this.pauseStart = null;

            console.log("Habit resumed successfully");

            // Sync to Firestore if online
            await this.immediateSync();

            // Refresh the pauses and habits from Dexie
            await this.$store.dispatch('fetchPauses');
            await this.$store.dispatch('fetchHabits');

          } catch (error) {
            console.error("Error resuming habit:", error);
            this.$toast.error({
              message: 'Error resuming habit. Please try again.',
              duration: 2000
            });
          }
        }
      );
    },
    editHabit() {
      //use addHabit layout for edit habit
      this.$router.push({ name: 'edit-habit', params: { habitId: this.selectedHabit.habitId } });
    },
    deleteHabit() {
      //confirmation to delete habit
      this.dialogStore.openDialog(
        'Delete Habit',
        'Are you sure you want to delete this habit?',
        'default',
        async () => {
          try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (user) {
              // Delete all progress entries from Dexie with the habit id
              await db.progress.where('habitId').equals(this.selectedHabit.habitId).delete();

              // Delete habit from Dexie (soft delete for sync)
              await db.habits.update(this.selectedHabit.habitId, {
                _deleted: true,
                syncStatus: 'pending', // Mark for sync
                updatedAt: Date.now(), // Track modification time
              });

              // Sync to Firestore if online
              await this.immediateSync();

              this.$toast.info({
                message: 'Habit deleted successfully!',
                duration: 2000
              });

              // Refresh habits from Dexie
              await this.$store.dispatch('fetchHabits');

              setTimeout(() => {
                this.$router.push('/');
              }, 300);
            }
          } catch (error) {
            console.log(error);
            this.$toast.error({
              message: 'Error deleting habit. Please try again.',
              duration: 2000
            });
          }
        }, 'Delete', 'text-red-400'
      );
    },
  },
  watch: {
    selectedHabit: 'handleSelectedHabitChange'
  },
  mounted() {
    this.handleSelectedHabitChange();
    if (this.$refs.galleryContainer) {
      this.$refs.galleryContainer.addEventListener('wheel', this.handleScroll, { passive: false });
    }
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleClickOutside);
    if (this.$refs.galleryContainer) {
      this.$refs.galleryContainer.removeEventListener('wheel', this.handleScroll);
    }
    clearTimeout(this.scrollTimeout);
  },
  beforeRouteLeave(to, from, next) {
    if (from.name && to.name != 'edit-habit') { // Check if user is navigating away
      this.$store.commit('setSelectedHabit', null);
    }
    next();
  }
};
</script>

<style scoped>
.loader {
  border: 3px solid #4b5563;
  /* Light gray */
  border-top: 3px solid transparent;
  /* Set this to transparent, so the inline color shows */
  border-radius: 50%;
  width: 24px;
  /* Keep this equal to height */
  height: 24px;
  /* Keep this equal to width */
  animation: spin 1s linear infinite;
  box-sizing: border-box;
  /* Ensures border is included in width/height */
  display: inline-block;
  /* Ensures proper inline behavior */
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.image-gallery-container {
  width: 100%;
  overflow: hidden;
  padding: 10px 0;
}

.image-gallery {
  display: flex;
  overflow-x: auto;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  /* Internet Explorer 10+ */
}

.image-gallery::-webkit-scrollbar {
  display: none;
  /* WebKit */
}

.image-wrapper {
  flex: 0 0 auto;
  margin-right: 5px;
}

.gallery-image {
  height: 100px;
  width: auto;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  cursor: pointer;
}

.gallery-image:hover {
  transform: scale(1.05);
}
</style>