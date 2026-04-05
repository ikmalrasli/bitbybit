<template>
    <div class="w-full h-full flex flex-row">
      <div class="w-full h-full flex flex-col bg-white">
        <!-- Header -->
        <header class="bg-white p-4 flex flex-row relative">
          <button @click="goBack" class="material-icons">chevron_left</button>
          <h1 class="text-lg text-black font-semibold absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">Add Sunnah</h1>
        </header>
  
        <!-- Form Content -->
        <div class="flex-1 overflow-y-auto p-4">
          <form @submit.prevent="createEntry" class="space-y-4">
            <!-- Name -->
            <div>
              <label for="name" class="text-left block text-sm font-medium text-gray-700">Name</label>
              <input v-model="formData.name" type="text" id="name" class="mt-1 block w-full p-2 border border-gray-300 rounded-md" autocomplete="off" />
            </div>
  
            <!-- Daily Goal -->
            <div>
              <label for="dailyGoal" class="text-left block text-sm font-medium text-gray-700">Daily Goal</label>
              <div class="mt-1 flex justify-center items-center space-x-2">
                <button type="button" @click="decreaseGoal" class="bg-gray-300 text-gray-700 p-2 rounded-md">-</button>
                <input v-model="formData.dailyGoal" type="number" id="dailyGoal" class="bg-white text-black w-16 p-2 border border-gray-300 rounded-md text-center"/>
                <button type="button" @click="increaseGoal" class="bg-gray-300 text-gray-700 p-2 rounded-md">+</button>
                <span>Times</span>
              </div>
            </div>
  
            <!-- Repeat Section -->
            <div>
              <label class="text-left block text-sm font-medium text-gray-700">Repeat</label>
              <div class="mt-2 flex space-x-2 justify-between">
                <label v-for="(day, index) in days" :key="index" class="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    :checked="formData.repeatDays[day]"
                    @change="toggleRepeat(day)"
                    class="form-checkbox h-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <span class="text-sm">{{ day.charAt(0).toUpperCase() + day.slice(1) }}</span>
                </label>
              </div>
            </div>
            
            <!-- Description -->
            <div>
              <label for="notes" class="text-left block text-sm font-medium text-gray-700">Description</label>
              <textarea v-model="formData.description" id="notes" class="bg-white text-black mt-1 block w-full p-2 border border-gray-300 rounded-md min-h-32" placeholder="Optional"></textarea>
            </div>
            
            <!-- Notes -->
            <div class="flex flex-col space-y-2">
              <label for="adminNotes" class="text-left block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                v-model="formData.notes"
                id="adminNotes"
                ref="notesTextarea"
                class="leading-tight bg-white text-black mt-1 block w-full p-2 border border-gray-300 rounded-md min-h-24 resize-none overflow-y-auto"
                placeholder="Optional notes for this sunnah"
                @input="adjustTextareaHeight"
              ></textarea>

              <!-- Selected Media Preview -->
              <draggable 
                v-model="selectedPhotos" 
                itemKey="id" 
                class="grid grid-cols-4 md:grid-cols-5 gap-2"
                :animation="200"
                :ghost-class="'bg-gray-200'"
              >
                <template #item="{ element, index }">
                  <div class="relative bg-gray-100 rounded-md overflow-hidden border">
                    <img 
                    :src="element.url ? element.url: element" 
                    :alt="`Photo ${index + 1}`" 
                    class="w-full object-cover"
                    style="aspect-ratio: 1 / 1;" />
                    <button 
                      @click="removePhoto(index)" 
                      class="absolute top-1 right-1 h-5 w-5 bg-opacity-50 bg-gray-700 text-white rounded-full"
                    >
                      <span class="material-icons text-sm">close</span>
                    </button>
                  </div>
                </template>
              </draggable>

              <!-- Selected Youtube Urls Preview -->
              <div v-for="(video, index) in formData.youtubeUrls" :key="index" 
              class="flex items-center border rounded-md content-center justify-between text-sm p-2">

                <div class="flex items-center">
                  <i class="fa-brands fa-youtube text-xl mx-2" style="color: #ff0000;"></i>
                  <a :href="video.url" target="_blank" 
                  class="ml-2 hover:underline">
                    <span class="block truncate">{{ formatURLTitle(video.title) }}</span>
                    <span class="block text-xs">{{ formatURLTitle(video.channel) }}</span>
                  </a>
                </div>
                
                <button type="button" @click="removeYoutubeUrl(index)" class="text-black text-sm">
                  <span class="material-icons">close</span>
                </button>
              </div>

              <!-- Selected Spotify Urls Preview -->
              <div v-for="(track, index) in formData.spotifyUrls" :key="index" 
              class="flex items-center border rounded-md content-center justify-between text-sm p-2">

                <div class="flex items-center">
                  <i class="fa-brands fa-spotify text-xl mx-2" style="color: #1DB954;"></i>
                  <a :href="track.url" target="_blank" 
                  class="ml-2 truncate hover:underline">
                    <span class="block">{{ formatURLTitle(track.title) }}</span>
                    <span class="block text-xs">{{ track.artist }}</span>
                  </a>
                </div>
                
                <button type="button" @click="removeSpotifyUrl(index)" class="text-black text-sm">
                  <span class="material-icons">close</span>
                </button>
              </div>

              <!-- Media Buttons -->
              <input type="file" id="photo-input" ref="photoInput" multiple 
              accept="image/*" @change="handlePhotoSelect" class="hidden" />

              <div class="flex space-x-2 justify-end">
                <button 
                  type="button" 
                  @click="triggerPhotoInput"
                  class="w-14 space-x-1 text-white p-2 px-4 rounded-full h-10 flex justify-center items-center transition-colors duration-200 bg-violet-400 hover:bg-violet-500 active:bg-violet-500"
                >
                  <i class="fa-solid fa-image text-xl"></i>
                </button>

                <button 
                  type="button" 
                  @click="openYoutubeDialog"
                  class="w-14 space-x-1 p-2 px-4 rounded-full 
                  h-10 flex justify-center items-center"
                  style="background-color: #ff0000;"
                >
                  <i class="fa-brands fa-youtube text-xl" style="color: #ffffff;"></i>
                </button>

                <button 
                  type="button" 
                  @click="openSpotifyDialog"
                  class="w-14 space-x-1 p-2 px-4 rounded-full 
                  h-10 flex justify-center items-center bg-gray-700"
                >
                  <i class="fa-brands fa-spotify text-xl" style="color: #1ed760;"></i>
                </button>
              </div>

            </div>
            
            <!-- Reference URL -->
            <div>
              <label for="name" class="text-left block text-sm font-medium text-gray-700">Reference URL</label>
              <input v-model="formData.refUrl" type="text" id="name" class="mt-1 block w-full p-2 border border-gray-300 rounded-md" autocomplete="off" />
            </div>
          </form>
        </div>
  
        <!-- Floating Create Button -->
        <div class="sticky bottom-0 p-4">
          <button @click="createEntry" class="min-h-12 w-full bg-violet-400 text-white font-bold py-3 rounded-lg shadow-lg">
            {{ buttonText }} 
          </button>
        </div>
        
        <!-- Dialogs -->
        <youtubeDialog @add-link="handleYoutubeLink" />
        <spotifyDialog @add-link="handleSpotifyLink" />
      </div>
    </div>  
</template>
  
  <script>
  import { db } from "../firebase"; // Firestore instance
  import { collection, addDoc, updateDoc, doc } from "firebase/firestore"; // Firestore methods
  import { getAuth } from "firebase/auth"; // Firebase Authentication
  import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"; // Firebase Storage
  import { useDialogStore } from '../store/dialogStore';
  import youtubeDialog from "../components/dialogs/youtube-dialog.vue";
  import spotifyDialog from "../components/dialogs/spotify-dialog.vue";
  import draggable from 'vuedraggable';
  
  export default {
  components: {
    youtubeDialog,
    spotifyDialog,
    draggable
  },
    data() {
      return {
        formData: {
          name: "",
          dailyGoal: 1,
          repeatDays: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: true },
          description: "",
          refUrl: "",
          notes: "",
          youtubeUrls: [],
          spotifyUrls: [],
        },
        days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
        isLoading: false, // Loading state for the button
        loadingText: 'Create', // Initial button text
        dialogStore: useDialogStore(),
        selectedPhotos: [],
        createdSunnahId: null, // Store the created sunnah ID for image uploads
      };
    },
    computed: {
      buttonText() {
        return this.isLoading ? this.loadingText : 'Create'; // Toggle text based on loading state
      }
    },
    methods: {
      toggleRepeat(day) {
        this.formData.repeatDays[day] = !this.formData.repeatDays[day];
      },
      goBack() {
        this.$router.push('/');
      },
      increaseGoal() {
        this.formData.dailyGoal++;
      },
      decreaseGoal() {
        if (this.formData.dailyGoal > 1) {
          this.formData.dailyGoal--;
        }
      },
      adjustTextareaHeight() {
        const textarea = this.$refs.notesTextarea;
        textarea.style.height = 'auto'; // Reset the height
        textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px'; // Adjust height based on content, with a max of 100px
      },
      removeYoutubeUrl(index) {
        this.formData.youtubeUrls.splice(index, 1);
      },
      removeSpotifyUrl(index) {
        this.formData.spotifyUrls.splice(index, 1);
      },
      openYoutubeLink(video){
        let link = '';
        if (!video.id.videoId){
          link = `https://www.youtube.com/watch?v=${video.id}`
        } else {
          link = `https://www.youtube.com/watch?v=${video.id.videoId}`
        }
        return link
      },
      handleYoutubeLink(link) {
        if (link) {
          this.formData.youtubeUrls.push({ 
            title: this.decodeHtmlEntities(link.snippet.title), 
            channel:this.decodeHtmlEntities(link.snippet.channelTitle), 
            url: this.openYoutubeLink(link) 
          });
        } else {
          console.error("No link received from Youtube dialog.");
        }
      },
      handleSpotifyLink(link) {
        if (link) {
          this.formData.spotifyUrls.push({
            title: link.name,
            artist: link.artists[0].name,
            url: link.external_urls.spotify
          });
        } else {
          console.error("No link received from Spotify dialog.");
        }
      },
      triggerPhotoInput() {
        this.$refs.photoInput.click(); // Trigger the hidden file input click
      },
      handlePhotoSelect(event) {
        const files = Array.from(event.target.files);
        const newPhotos = files.map(file => ({
          id: Date.now() + Math.random(),
          file,
          url: URL.createObjectURL(file)
        }));
        this.selectedPhotos = [...this.selectedPhotos, ...newPhotos];
      },
      removePhoto(index) {
        URL.revokeObjectURL(this.selectedPhotos[index].url);
        this.selectedPhotos.splice(index, 1);
      },
      decodeHtmlEntities(text) {
        const txt = document.createElement("textarea");
        txt.innerHTML = text;
        return txt.value;
      },
      formatURLTitle(title) {
        const maxLength = 35; // Maximum length before truncating
        if (title.length > maxLength) {
          return `${title.substring(0, maxLength)}...`; // Truncate and append ellipsis
        }
        
        return title; // Return original file name if it's within limit
      },
      openYoutubeDialog(){
        this.dialogStore.openYoutubeDialog();
      },
      openSpotifyDialog(){
        this.dialogStore.openSpotifyDialog();
      },
      async uploadPhotos() {
        if (!this.selectedPhotos || this.selectedPhotos.length === 0) return [];

        // Create a new array with placeholders for correct order
        const urls = new Array(this.selectedPhotos.length).fill(null);

        // Upload valid files and place their URLs in the correct index
        const uploadPromises = this.selectedPhotos.map(async (photo, index) => {
          if (photo.file instanceof File) {
            const storage = getStorage();
            const storageRef = ref(storage, `sunnahs/${this.createdSunnahId}/images/${index}_${photo.file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, photo.file);

            return new Promise((resolve, reject) => {
              uploadTask.on(
                "state_changed",
                null,
                (error) => {
                  console.error("Error uploading photo:", error);
                  reject("Failed to upload photo.");
                },
                async () => {
                  const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                  urls[index] = downloadURL; // Place URL in correct index
                  resolve(downloadURL);
                }
              );
            });
          } else if (typeof photo === "string") {
            urls[index] = photo; // Preserve existing URL in correct index
          }
        });

        await Promise.all(uploadPromises);

        // Filter out null values and return the ordered URLs
        return urls.filter(url => url !== null);
      },
      async createEntry() {
        try {
          this.isLoading = true; // Set loading state to true
          this.startLoadingDots();
  
          const auth = getAuth();
          const user = auth.currentUser;
  
          if (!user) {
            throw new Error("User not authenticated. Please log in.");
          }
  
          // Step 1: Add the sunnah to the "sunnahs" collection to get the ID
          const habitRef = await addDoc(collection(db, "sunnahs"), {
            name: this.formData.name,
            dailyGoal: this.formData.dailyGoal,
            repeat: this.formData.repeatDays,
            description: this.formData.description,
            refUrl: this.formData.refUrl,
            notes: this.formData.notes,
            youtubeUrls: this.formData.youtubeUrls,
            spotifyUrls: this.formData.spotifyUrls,
            imageUrls: [], // Will be updated after image upload
          });

          // Store the created sunnah ID for image upload
          this.createdSunnahId = habitRef.id;

          // Step 2: Upload images if any
          const photoUrls = await this.uploadPhotos();

          // Step 3: Update the sunnah document with image URLs
          if (photoUrls.length > 0) {
            await updateDoc(doc(db, "sunnahs", habitRef.id), {
              imageUrls: photoUrls
            });
          }
  
          console.log("Sunnah created successfully with ID:", habitRef.id);
          alert("Sunnah created successfully!");
        } catch (error) {
          console.error("Error creating sunnah:", error);
          alert("Error creating sunnah: " + error.message);
        } finally {
          this.isLoading = false; // Reset loading state
          this.loadingText = 'Create'; // Reset button text
          this.resetForm();
        }
      },
      resetForm() {
        this.formData = {
          name: "",
          dailyGoal: 1,
          repeatDays: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: true },
          description: "",
          refUrl: "",
          notes: "",
          youtubeUrls: [],
          spotifyUrls: [],
        };
        this.selectedPhotos = [];
        this.createdSunnahId = null;
      },
      startLoadingDots() {
        let dotCount = 1;
        const loadingInterval = setInterval(() => {
          dotCount = (dotCount + 1) % 4; // Loop between 0 and 3
          this.loadingText = '.'.repeat(dotCount); // Update loading text with dots
  
          if (!this.isLoading) {
            clearInterval(loadingInterval); // Stop interval if not loading
          }
        }, 250); // Update every 250 ms
      },
    },
  };
  </script>
  
  <style scoped>
  
  </style>
  