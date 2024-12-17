<template>
  <div class="w-full h-full flex flex-col bg-white">
    <!-- Full-Screen Image Modal -->
    <div v-if="isImgFullscreen" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
    @click.self="closeImgFullscreen">
      <!-- Full-Screen Image -->
      <div class="relative">
        <img :src="fullscreenImageUrl" alt="Full-Screen Image" 
        class="object-contain max-h-full max-w-full"
        :style="{ transform: `scale(${imageScale})` }" />
        <span v-if="imageUrls.length > 1" class="absolute top-2 right-2 text-xs rounded-full bg-black bg-opacity-60 text-white px-1">
          {{ currentImageIndex + 1 }}/{{ imageUrls.length }}</span>
      </div>
      
      
      <!-- Navigation Buttons -->
      <button
      v-if="currentImageIndex > 0" @click="prevImage"
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
    <header class="bg-white p-4 flex flex-row relative justify-between">
      <button @click="goBack" class="material-icons rounded-full active:bg-gray-200">chevron_left</button>
      <h1 
      class="px-4 text-xl text-black font-bold truncate max-w-xs whitespace-nowrap overflow-hidden">
      {{ selectedHabit?.name || 'Habit Details' }}</h1>

      <!-- More Options Button (Dropdown Toggle) -->
      <div class="relative">
        <!-- Dropdown Toggle Button -->
        <button @click="toggleDropdown" class="material-icons rounded-full active:bg-gray-200">more_horiz</button>

        <!-- Dropdown Menu -->
        <div v-if="isDropdownOpen" class="absolute right-0 z-10 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200" @click.stop>
          <ul class="py-1 text-gray-700">
            <li @click="editOption" class="grid grid-cols-[auto,1fr] items-center px-4 py-2 text-md hover:bg-gray-100 cursor-pointer">
              <span class="material-icons">edit</span>
              <span class="text-center w-full">Edit habit</span>
            </li>
            <li @click="deleteOption" class="grid grid-cols-[auto,1fr] items-center px-4 py-2 text-md text-red-500 hover:bg-gray-100 cursor-pointer">
              <span class="material-icons">delete</span>
              <span class="text-center w-full">Delete habit</span>
            </li>
          </ul>
        </div>
      </div>
    </header>

    <div class="h-96 flex-grow overflow-y-auto px-4 space-y-2 pb-4 scrollbar-hide"
    :class="[isImgFullscreen ? 'overflow-hidden' : '']">
      <!-- Progress Card -->
      <div class="w-full p-4 text-gray-700 bg-white border rounded-lg text-center">
        <h2 class="flex-auto text-xl block mb-2">Progress</h2>
        <h1 class="flex-auto text-5xl">{{ addProgress }}</h1>
        <h2 class="flex-auto text-xl mb-2">/ {{ selectedHabit?.dailyGoal }}</h2>

        <div class="w-full justify-center flex">
          <!-- Minus Button -->
          <button type="button" @click="decreaseGoal" 
          class="material-icons p-1 text-gray-700 rounded-full active:bg-gray-200">remove</button>

          <!-- Slider -->
          <input v-if="selectedHabit"
            type="range" :min="0" :max="selectedHabit.dailyGoal"
            v-model.number="addProgress"
            class="range w-1/2 mx-2"
            :class="[selectedHabit.color ? `accent-${selectedHabit.color.default}`: 'accent-violet-400']" />

          <!-- Plus Button -->
          <button type="button" @click="increaseGoal" 
          class="material-icons p-1 text-gray-700 rounded-full active:bg-gray-200">add</button>
        </div>

        <!-- Reset Progress Button -->
        <button type="button" @click="removeTodayEntries" class="material-icons text-gray-700 mt-4 mr-2 p-1 rounded-full active:bg-gray-200">replay</button>
        <!-- Add Progress Button-->
        <button type="button" @click="confirmProgress" 
          class="material-icons font-semibold mt-4 ml-2 p-1 rounded-full active:bg-gray-200 disabled:text-gray-400 disabled:font-normal"
          :class="selectedHabit?.color ? `text-${selectedHabit?.color.default}` : 'text-violet-400'"
          :disabled="addProgress == selectedHabit?.progress || loading" 
        >
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
      class="w-full p-4 text-gray-700 bg-white border rounded-lg space-y-2">
        <h2 class="text-lg text-center block mb-2">Notes</h2>
        <p v-if="selectedHabit?.notes" class="leading-tight py-2" style="white-space: pre-wrap;" v-html="processedNotes"></p>
        
        <!-- <div v-if="selectedHabit?.imageUrl">
          <img @click="openImgFullscreen" :src="selectedHabit.imageUrl" alt="Uploaded Image" 
          class="object-cover rounded-md cursor-pointer" />
        </div> -->

        <!-- Photo Gallery -->
        <div v-if="selectedHabit?.imageUrls?.length > 0" class="w-full text-gray-700 bg-white">
          <div class="snap-x snap-mandatory flex overflow-x-auto md:overflow-x-scroll"
          style="scrollbar-width: thin;" ref="gallery">
            <div v-for="(imageUrl, index) in imageUrls" :key="index" 
            class="flex relative image-wrapper snap-center flex-shrink-0 w-full">
              <img 
                :src="imageUrl" 
                :alt="`Image ${index + 1}`" 
                class="flex flex-grow w-full object-cover rounded-lg border cursor-pointer transition-transform duration-300 ease-in-out"
                @click="openImgFullscreen2(imageUrl)"
              />
              <span v-if="imageUrls.length > 1" class="absolute top-2 right-2 text-xs rounded-full bg-black bg-opacity-30 text-white px-1">
                {{ index + 1 }}/{{ imageUrls.length }}</span>
            </div>
          </div>
        </div>

        <!-- Youtube Urls -->
        <div v-if="selectedHabit?.youtubeUrls?.length > 0" class="w-full space-y-2">
          <div v-for="(video, index) in selectedHabit.youtubeUrls" :key="index"
          class="flex items-center border rounded-md content-center justify-between text-sm p-2">

            <div class="flex items-center">
              <i class="fa-brands fa-youtube text-xl mx-2" style="color: #ff0000;"></i>
              <a :href="video.url" target="_blank" 
              class="ml-2 hover:underline">
                <span class="block truncate">{{ formatURLTitle(video.title) }}</span>
                <span class="block text-xs">{{ video.channel }}</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Spotify Urls -->
        <div v-if="selectedHabit?.spotifyUrls?.length > 0" class="w-full space-y-2">
          <div v-for="(track, index) in selectedHabit.spotifyUrls" :key="index"
          class="flex items-center border rounded-md content-center justify-between text-sm p-2">
            <div class="flex items-center">
              <i class="fa-brands fa-spotify text-xl mx-2" style="color: #1DB954;"></i>
              <a :href="track.url" target="_blank" 
              class="ml-2 truncate hover:underline">
                <span class="block">{{ formatURLTitle(track.title) }}</span>
                <span class="block text-xs">{{ track.artist }}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline Card -->
      <div class="w-full justify-between flex flex-col p-4 px-4 text-gray-700 bg-white border rounded-lg">
        <h2 class="text-lg text-center block mb-2">Term</h2>
        <div class="flex flex-row justify-between space-x-2 items-center">
          <span class="min-w-24 text-center text-sm text-nowrap font-medium text-black text-opacity-50 rounded-full py-0.5 px-2 bg-black bg-opacity-5">
            {{ habitTermStart.toLocaleDateString('en-UK', { day: 'numeric', month: 'short', year: 'numeric' }) }}
          </span>
          <hr class="flex-grow border-t mx-2"
          :class="selectedHabit?.color ? `border-${selectedHabit?.color.default}` : 'border-violet-400'" />
          <span class="min-w-24 text-center text-sm text-nowrap font-medium text-black text-opacity-50 rounded-full py-0.5 px-2 bg-black bg-opacity-5">
            {{ selectedHabit?.termEnd ? habitTermEnd.toLocaleDateString() : 'No end' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { db } from "../../firebase"; // Firestore instance
import { collection, query, where, getDocs, deleteDoc, Timestamp, addDoc, orderBy, doc, updateDoc } from "firebase/firestore"; // Firestore methods
import { getAuth } from "firebase/auth"; // Firebase Authentication
import { useDialogStore } from '../../store/dialogStore';
import { useStatStore } from '../../store/statStore.js';

export default {
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
      return new Timestamp(this.selectedHabit?.termEnd.seconds, this.selectedHabit?.termEnd.nanoseconds).toDate()
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

        const q = query(
          collection(db, 'progress'),
          where('habitId', '==', habitId),
          where('timestamp', '>=', Timestamp.fromDate(dayStart)),
          where('timestamp', '<=', Timestamp.fromDate(dayEnd))
        );

        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });

        this.$store.dispatch('fetchWeekProgress');
        this.addProgress = 0;
        this.$store.state.selectedHabit.progress = 0;
        this.docId = null;
        this.statStore.setProgressUpdated();

        if (this.firstFetchWeekProgress===false){
          this.$store.dispatch('fetchWeekProgress');
          this.$store.commit('setFirstFetchWeekProgress', true);
        }
      } catch (error) {
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
    },
    checkProgress() {
      if (this.selectedHabit?.progressId !== '') {
        this.docId = this.selectedHabit?.progressId;
      } else {
        this.docId = null;
      }
    },
    createProgress() {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error("User not authenticated. Please log in.");
      }

      this.loading = true; // Start loading
      const habitRef = addDoc(collection(db, "progress"), {
        habitId: this.selectedHabit.habitId,
        progress: this.addProgress,
        timestamp: this.setTimestamp,
        onTime: this.onTime
      });

      habitRef.then((docRef) => {
        this.loading = false; // End loading
        this.docId = docRef.id;

        if (this.firstFetchWeekProgress===false){
          this.$store.dispatch('fetchWeekProgress');
          this.$store.commit('setFirstFetchWeekProgress', true);
        }

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
      }).catch((error) => {
        this.loading = false; // End loading on error
        console.error(error);
        this.$toast.error({
          message: 'Error. Please try again.',
          duration: 2000
        });
      });
    },
    updateProgress() {
      if (this.docId) {
        this.loading = true; // Start loading
        try{
          const docRef = doc(db, 'progress', this.docId);
          updateDoc(docRef, {
            progress: this.addProgress,
            timestamp: this.setTimestamp,
            onTime: this.onTime
          }).then(() => {
            this.loading = false; // End loading

            if (this.firstFetchWeekProgress===false){
              this.$store.dispatch('fetchWeekProgress');
              this.$store.commit('setFirstFetchWeekProgress', true);
            }
            
            if (this.addProgress === this.selectedHabit.dailyGoal) {
              this.$toast.success({
                message: 'Habit completed!',
                duration: 2500
              });
              setTimeout(() => {
                this.$router.push('/'), 1000;
              })
            } else if (this.addProgress > this.selectedHabit.progress) {
              this.$toast.info({
                message: 'Habit progress increased!',
                duration: 2500
              });
            }
            this.selectedHabit.progress = this.addProgress;
          }).catch(error => {
            this.loading = false; // End loading on error
            console.error(error);
          });
        } catch(error) {
          console.log(error);
        }
      } else {
        this.createProgress();
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
        () => {
          try{
            const auth = getAuth();
            const user = auth.currentUser;
            if (user){
              //delete all progress from firestore with the habit id
              const q = query(
                collection(db, 'progress'),
                where('habitId', '==', this.selectedHabit.habitId)
              );
              getDocs(q).then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                  deleteDoc(doc.ref);
                });
              });

              //delete habit from firestore
              const docRef = doc(db, "habits", this.selectedHabit.habitId);
              deleteDoc(docRef);
              
              this.$toast.info({
                message: 'Habit deleted successfully!',
                duration: 2000
              });

              this.$store.dispatch('fetchHabits');
              setTimeout(() => {
                this.$router.push('/');
              }, 300);
            }
          } catch(error) {
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
        if (from.name && to.name!='edit-habit') { // Check if user is navigating away
          this.$store.commit('setSelectedHabit', null);
        }
        next();
    }
};
</script>

<style scoped>
.loader {
  border: 3px solid #4b5563; /* Light gray */
  border-top: 3px solid transparent; /* Set this to transparent, so the inline color shows */
  border-radius: 50%;
  width: 24px; /* Keep this equal to height */
  height: 24px; /* Keep this equal to width */
  animation: spin 1s linear infinite;
  box-sizing: border-box; /* Ensures border is included in width/height */
  display: inline-block; /* Ensures proper inline behavior */
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer 10+ */
}

.image-gallery::-webkit-scrollbar {
  display: none; /* WebKit */
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