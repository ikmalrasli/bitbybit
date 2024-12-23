<template>
  <div class="w-full h-full flex"
  @click="startLoadingDots">
    <div class="w-full h-full flex flex-col bg-white relative">
      <!-- Header -->
      <header class="bg-white p-4 flex flex-row relative">
        <button @click="goBack" class="material-icons z-10">chevron_left</button>
        <h1 class="w-full text-center truncate text-lg text-black font-bold absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {{ formData.name === '' ? title : formData.name }}</h1>
      </header>

      
      <!-- Form Content -->
      <div class="flex-grow h-96 overflow-y-auto scrollbar-hide p-4 pb-20">
        <form @submit.prevent="createEntry" class="space-y-4">
          <!-- Name and color picker-->
          <div class="flex space-x-4 items-center">
            <!-- Name Field -->
            <div class="flex-1">
              <label for="name" class="text-left block text-sm font-medium text-gray-700">Name</label>
              <input 
                v-model="formData.name" 
                type="text" 
                id="name" 
                class="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none" 
                :class="[ 
                  'focus:ring-1 focus:' + `ring-${formData.color.active}`, 
                  'focus:' + `border-${formData.color.active}` 
                ]" 
                autocomplete="off" 
              />
            </div>

            <!-- Color Picker Button -->
            <div class="relative">
              <label for="color" class="text-left block text-sm font-medium text-gray-700">Color</label>
              <button 
                type="button"
                @click="toggleColorPicker" 
                class="flex items-center justify-between p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                <div class="flex items-center space-x-2">
                  <!-- Show the selected color -->
                  <div 
                    :class="`bg-${formData.color.default}`" 
                    class="w-6 h-6 rounded-full border border-gray-400"
                  ></div>
                </div>
                <span class="material-icons transform" :class="{ 'rotate-180': showColorPicker }">expand_more</span>
              </button>

              <!-- Color Picker Dropdown -->
              <div 
                v-if="showColorPicker" 
                class="items-center absolute z-10 w-16 mt-2 p-2 bg-white border border-gray-300 rounded-md shadow-lg flex flex-col gap-2"
              >
                <div
                  v-for="(color, index) in listColors"
                  :key="index"
                  :class="[
                    `bg-${color.default}`,
                    formData.color === color ? `border-${color.active}` : 'border-transparent',
                    'border-2 w-8 h-8 rounded-full cursor-pointer transition duration-200'
                  ]"
                  @click="selectColor(color)"
                ></div>
              </div>
            </div>
          </div>

          <!-- Daily Goal -->
          <div>
            <label for="dailyGoal" class="text-left block text-sm font-medium text-gray-700">Daily Goal</label>
            <div class="mt-1 flex items-center justify-center space-x-2">
              <button 
                type="button" 
                @click="decreaseGoal" 
                class="material-icons text-white p-2 rounded-full" 
                :class="[`bg-${formData.color.default}`, 'hover:'+ `bg-${formData.color.active}`, 'active:'+`bg-${formData.color.active}`]"
              >remove</button>
              <input v-model="formData.dailyGoal" type="number" id="dailyGoal" class="no-arrows bg-white text-black w-12 p-2 border border-gray-300 rounded-md text-center"/>
              <button 
                type="button" 
                @click="increaseGoal" 
                class="material-icons text-white p-2 rounded-full" 
                :class="[`bg-${formData.color.default}`, 'hover:'+ `bg-${formData.color.active}`, 'active:'+`bg-${formData.color.active}`]"
              >add</button>
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

          <!-- Reminder -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Reminder <span class="text-gray-400">(Optional)</span>
            </label>
            <!-- <div class="flex items-center justify-center space-x-3">
              <i class="material-icons text-gray-500">schedule</i>
              <input 
                type="time" 
                v-model="formData.reminder" 
                class="border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-1/2 p-2 text-sm"
              />
              <button 
                type="button"
                @click="formData.reminder = null" 
                class="bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm disabled:bg-gray-300 disabled:text-gray-700 disabled:font-normal transition-colors duration-200"
                :disabled="formData.reminder === null"
              >
                Reset
              </button>
            </div> -->
            
            <!-- Setted Reminders Preview -->
            <div v-if="formData.reminders && formData.reminders?.length > 0" class="flex flex-wrap"
              style="scrollbar-width: thin;">
              <div v-for="(time, index) in formData.reminders" :key="index" 
              class="flex items-center border rounded-full space-x-2 text-sm py-2 px-3">

                <div class="flex items-center w-20">
                  <i class="fa-regular fa-clock"></i>
                  <span class="ml-1">
                    <span class="block">{{ convertTime(time) }}</span>
                  </span>
                </div>
                
                <button type="button" @click="removeReminder(index)" class="text-black text-sm items-center">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
              

            <div class="flex justify-center">
              <button 
                  type="button" 
                  @click="openReminderDialog"
                  class="space-x-1 p-2 px-4 rounded-full text-white"
                  :class="[`bg-${formData.color.default}`, 'hover:'+ `bg-${formData.color.active}`, 'active:'+`bg-${formData.color.active}`]"
                >
                Add Reminder
              </button>
            </div>
          </div>

          <!-- Notes -->
          <div class="flex flex-col space-y-2">
            <label for="notes" class="text-left block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              v-model="formData.notes"
              id="notes"
              ref="notesTextarea"
              class="leading-tight bg-white text-black mt-1 block w-full p-2 border border-gray-300 rounded-md min-h-24 resize-none overflow-y-auto "
              :class="[
                'focus:ring-1 focus-within:' + `ring-${formData.color.active}`, 
                'focus-within:' + `border-${formData.color.active}`
              ]"
              placeholder="Optional"
              @input="adjustTextareaHeight"
            ></textarea>

            <!-- Selected Media Preview -->
            <!-- <div v-if="formData.imageUrl" class="flex items-center border rounded-md content-center justify-between text-sm">
              <div class="flex items-center">
                <img :src="imagePreviewUrl" alt="Selected Image" class="h-10 w-10 object-cover rounded-md" />
                <span class="ml-2">{{ formatFileName(formData.imageUrl) }}</span>
              </div>
              
              <button @click="removeImage" class="m-2 text-black text-sm">
                <span class="material-icons">close</span>
              </button>
            </div> -->

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
                class="w-14 space-x-1 text-white p-2 px-4 rounded-full h-10 flex justify-center items-center transition-colors duration-200"
                :class="[`bg-${formData.color.default}`, 'hover:'+ `bg-${formData.color.active}`, 'active:'+`bg-${formData.color.active}`]"
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

          <!-- Term -->
          <div class="grid grid-cols-2 gap-2 w-full">
            <div class="flex flex-col">
              <label for="term-start" class="block text-sm font-medium text-gray-700">Start Date</label>
              <input v-model="formData.termStart" type="date" id="term-start" class="bg-white text-black mt-1 w-full p-2 border border-gray-300 rounded-md text-center" />
            </div>
            <div class="flex flex-col">
              <label for="term-end" class="block text-sm font-medium text-gray-700">End Date<span class="text-s ml-2 text-gray-400">(Optional)</span></label>
              <input v-model="formData.termEnd" type="date" id="term-end" class="bg-white text-black mt-1 w-full p-2 border border-gray-300 rounded-md text-center" />
            </div>
          </div>
        </form>
      </div>

      <!-- Floating Create Button -->
      <div class="px-4 py-2 flex-shrink-0 absolute bottom-0 w-full">
        <button 
          @click="createEntry" 
          class="w-full text-white font-bold py-3 rounded-full shadow-lg disabled:bg-gray-300 disabled:text-gray-700 disabled:font-normal transition-colors duration-200"
          :class="[`bg-${formData.color.default}`, 'hover:'+ `bg-${formData.color.active}`, 'active:'+`bg-${formData.color.active}`]"
          :disabled="formData.name === ''"
        >
          {{ buttonText }}
        </button>
      </div>
      
      <!-- Dialogs -->
      <pickReminderDialog @saveReminders="saveReminders" />
      <youtubeDialog @add-link="handleYoutubeLink" />
      <spotifyDialog @add-link="handleSpotifyLink" /> 
    </div>
  </div>  
</template>

<script>
import { db } from "../../firebase"; // Firestore instance
import { collection, addDoc, updateDoc, doc, Timestamp } from "firebase/firestore"; // Firestore methods
import { getAuth } from "firebase/auth"; // Firebase Authentication
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"; // Firebase Storage
import { mapState } from "vuex";
import { useDialogStore } from '../../store/dialogStore';
import pickReminderDialog from "../../components/dialogs/reminder-dialog.vue";
import spotifyDialog from "../../components/dialogs/spotify-dialog.vue";
import youtubeDialog from "../../components/dialogs/youtube-dialog.vue";
import draggable from 'vuedraggable';


export default {
  components: {
    pickReminderDialog,
    youtubeDialog,
    spotifyDialog,
    draggable
  },
  data() {
    return {
      title: "Add Habits",
      formData: {
        name: "",
        dailyGoal: 1,
        repeatDays: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: true },
        notes: "",
        termStart: new Date().toISOString().split("T")[0], // Default to today
        termEnd: null,
        imageUrl: "",
        youtubeUrls: [],
        spotifyUrls: [],
        reminders: [],
        color: { default: "violet-400", active: "violet-500" }
      },
      days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      selectedFile: null,
      imagePreviewUrl: "",
      isLoading: false, 
      loadingText: 'Create',
      listColors:[
        { default: "violet-400", active: "violet-500" },
        { default: "red-300", active: "red-400" },
        { default: "orange-300", active: "orange-400" },
        { default: "yellow-300", active: "yellow-400" },
        { default: "emerald-300", active: "emerald-400" },
        { default: "blue-300", active: "blue-400" },
        { default: "pink-300", active: "pink-400" },
      ],
      showColorPicker: false,
      dialogStore: useDialogStore(),
      selectedPhotos: [],
    };
  },
  mounted() {
    if (this.$store.getters.selectedSunnah && this.$route.name === 'add-sunnah') {
      this.formData.name = this.$store.getters.selectedSunnah.name;
      this.formData.dailyGoal = this.$store.getters.selectedSunnah.dailyGoal;
      this.formData.repeatDays = this.$store.getters.selectedSunnah.repeat;
    } else if (this.$route.name === 'edit-habit') {
      this.title = 'Edit Habit';
      this.loadingText = 'Apply'
      this.formData.name = this.selectedHabit.name;
      this.formData.dailyGoal = this.selectedHabit.dailyGoal;
      this.formData.repeatDays = this.selectedHabit.repeat;
      this.formData.notes = this.selectedHabit.notes;
      this.formData.termStart = this.selectedHabit.termStart ? new Timestamp(this.selectedHabit.termStart.seconds, this.selectedHabit.termStart.nanoseconds).toDate().toISOString().split("T")[0] : '';
      this.formData.termEnd = this.selectedHabit.termEnd ? new Timestamp(this.selectedHabit.termEnd.seconds, this.selectedHabit.termEnd.nanoseconds).toDate().toISOString().split("T")[0] : '';
      this.formData.imageUrl = this.selectedHabit.imageUrl;
      this.imagePreviewUrl = this.selectedHabit.imageUrl;
      if (!this.selectedHabit.imageUrl) {
        this.selectedHabit.imageUrl = '';
      }
      if (this.selectedHabit.reminders) {
        this.formData.reminders = this.selectedHabit.reminders;
      }
      if (this.selectedHabit.color) {
        this.formData.color = { default: this.selectedHabit.color.default, active: this.selectedHabit.color.active };
      }
      if (this.selectedHabit.youtubeUrls) {
        this.formData.youtubeUrls = this.selectedHabit.youtubeUrls;
      }
      if (this.selectedHabit.spotifyUrls) {
        this.formData.spotifyUrls = this.selectedHabit.spotifyUrls;
      }
      if (this.selectedHabit.imageUrls) {
        this.selectedPhotos = this.selectedHabit.imageUrls;
      }
      
    }
  },
  computed: {
    buttonText() {
      if (this.$route.name === 'edit-habit') {
        return this.isLoading ? this.loadingText : 'Apply';
      }
      return this.isLoading ? this.loadingText : 'Create'; // Toggle text based on loading state
    },
    ...mapState(["selectedHabit", "firstFetchHabits"]),
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
    toggleColorPicker() {
      this.showColorPicker = !this.showColorPicker; // Toggle the visibility
    },
    selectColor(color) {
      this.formData.color = color; // Set the selected color
      this.showColorPicker = false; // Close the color picker after selection
    },
    adjustTextareaHeight() {
      const textarea = this.$refs.notesTextarea;
      textarea.style.height = 'auto'; // Reset the height
      textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px'; // Adjust height based on content, with a max of 200px
    },
    toggleRepeat(day) {
      this.formData.repeatDays[day] = !this.formData.repeatDays[day];
    },
    goBack() {
      if (this.$store.getters.selectedSunnah) {
        this.$router.push('/sunnahs/' + this.$store.getters.selectedSunnah.sunnahId);
      }
      else{
        this.$router.push('/');
      }
    },
    increaseGoal() {
      this.formData.dailyGoal++;
    },
    decreaseGoal() {
      if (this.formData.dailyGoal > 1) {
        this.formData.dailyGoal--;
      }
    },
    decodeHtmlEntities(text) {
      const txt = document.createElement("textarea");
      txt.innerHTML = text;
      return txt.value;
    },
    removeReminder(index) {
      this.formData.reminders.splice(index, 1);
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
    saveReminders(reminderTimes) {
      this.formData.reminders.push(...reminderTimes);
      this.formData.reminders.sort((a, b) => {
        const [aHour, aMinute] = a.split(':').map(Number);
        const [bHour, bMinute] = b.split(':').map(Number);

        if (aHour === bHour) {
          return aMinute - bMinute; // Sort by minute if hours are the same
        } else {
          return aHour - bHour; // Sort by hour
        }
      });
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
      this.selectedFile = true;
    },
    removePhoto(index) {
      URL.revokeObjectURL(this.selectedPhotos[index].url);
      this.selectedPhotos.splice(index, 1);
    },
    // onFileSelected(event) {
    //   this.selectedFile = event.target.files[0];
    //   if (this.selectedFile) {
    //     this.formData.imageUrl = this.selectedFile.name; // Show the selected file name
    //     this.imagePreviewUrl = URL.createObjectURL(this.selectedFile); // Create a preview URL
    //   }
    // },
    formatURLTitle(title) {
      const maxLength = 35; // Maximum length before truncating
      if (title.length > maxLength) {
        return `${title.substring(0, maxLength)}...`; // Truncate and append ellipsis
      }
      
      return title; // Return original file name if it's within limit
    },
    formatFileName(fileName) {
      const maxLength = 25; // Maximum length before truncating
      const extension = fileName.split('.').pop(); // Get file extension
      const baseName = fileName.substring(0, fileName.length - extension.length - 1); // Get base name without extension
      
      if (this.$route.name === 'edit-habit') {
        if (baseName.length > maxLength) {
          return `${baseName.substring(0, maxLength)}...`; // Truncate and append ellipsis
        }
      }

      if (baseName.length > maxLength) {
        return `${baseName.substring(0, maxLength)}... .${extension}`; // Truncate and append ellipsis
      }
      
      return fileName; // Return original file name if it's within limit
    },
    removeImage() {
      this.formData.imageUrl = ""; // Clear the image name
      this.imagePreviewUrl = ""; // Clear the preview URL
      this.selectedFile = null; // Clear the selected file
    },
    //uploadimage
    async uploadImage() {
      if (!this.selectedFile) return ""; // Return empty string if no file selected

      const storage = getStorage();
      const storageRef = ref(storage, `habit_img/${this.$store.state.user.uid}/${this.formData.name}/${this.selectedFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, this.selectedFile);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          null,
          (error) => {
            console.error("Error uploading image:", error);
            reject("Failed to upload image.");
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL); // Resolve with the download URL
          }
        );
      });
    },
    async uploadPhotos() {
      if (!this.selectedPhotos || this.selectedPhotos.length === 0) return [];

      // Create a new array with placeholders for correct order
      const urls = new Array(this.selectedPhotos.length).fill(null);

      // Upload valid files and place their URLs in the correct index
      const uploadPromises = this.selectedPhotos.map(async (photo, index) => {
        if (photo.file instanceof File) {
          const storage = getStorage();
          const storageRef = ref(storage, `habit_img/${this.$store.state.user.uid}/${this.formData.name}/${index}_${photo.file.name}`);
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
    openReminderDialog() {
      this.dialogStore.openReminderDialog()
    },
    openYoutubeDialog(){
      this.dialogStore.openYoutubeDialog();
    },
    openSpotifyDialog(){
      this.dialogStore.openSpotifyDialog();
    },
    async createEntry() {
      try {
        this.isLoading = true;
        this.startLoadingDots();

        const imageUrl = await this.uploadImage();
        const photoUrls = await this.uploadPhotos();
        const habitData = {
          name: this.formData.name,
          dailyGoal: this.formData.dailyGoal,
          repeat: this.formData.repeatDays,
          notes: this.formData.notes,
          termStart: this.formData.termStart ? new Date(this.formData.termStart) : null,
          termEnd: this.formData.termEnd ? new Date(this.formData.termEnd) : null,
          reminders: this.formData.reminders,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          imageUrl: imageUrl || this.formData.imageUrl,
          color: this.formData.color,
          imageUrls: photoUrls || this.selectedPhotos,
          youtubeUrls: this.formData.youtubeUrls,
          spotifyUrls: this.formData.spotifyUrls
        };

        if (this.$route.name === 'edit-habit') {
          await this.updateHabit(habitData);
        } else {
          await this.createHabit(habitData);
        }
      } catch (error) {
        this.handleError(error);
      } finally {
        this.resetLoadingState();
        this.goBack();
      }
    },
    async updateHabit(habitData) {
      try {
        await updateDoc(doc(db, "habits", this.selectedHabit.habitId), habitData);

        if (!this.firstFetchHabits) {
          this.$store.dispatch('fetchHabits');
          this.$store.commit('setFirstFetchHabits', true);
        }

        this.$toast.info({
          message: "Habit updated!",
          duration: 2000,
        });
      } catch (error) {
        throw new Error("Error updating habit: " + error.message);
      }
    },
    async createHabit(habitData) {
      try {
        const user = getAuth().currentUser;
        if (!user || this.formData.name === '') throw new Error("Invalid user or empty habit name.");

        await addDoc(collection(db, "habits"), {
          ...habitData,
          userId: user.uid,
          createdAt: new Date(),
        });

        if (!this.firstFetchHabits) {
          this.$store.dispatch('fetchHabits');
          this.$store.commit('setFirstFetchHabits', true);
        }

        this.$toast.success({
          message: "Habit created!",
          duration: 2000,
        });
      } catch (error) {
        throw new Error("Error creating habit: " + error.message);
      }
    },
    handleError(error) {
      console.error(error);
      this.$toast.error({
        message: "Error. Please try again.",
        duration: 2000,
      });
    },
    resetLoadingState() {
      this.isLoading = false;
      this.loadingText = this.$route.name === 'edit-habit' ? 'Apply' : 'Create';
    },
    startLoadingDots() {
      this.loadingText='...';
    },
  },
};
</script>

<style scoped>
.no-arrows {
  -moz-appearance: textfield;  /* Firefox */
  -webkit-appearance: none;    /* Chrome, Safari, Opera */
  appearance: none;            /* Standard */
}

/* Hides the arrows in Internet Explorer and Edge */
.no-arrows::-webkit-inner-spin-button,
.no-arrows::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.youtube-icon {
  color: #FF0000; /* YouTube red */
  position: relative; /* Needed for the pseudo-element positioning */
  font-size: 50px; /* Adjust the size as needed */
}

.youtube-icon::before {
  content: "\f167"; /* Font Awesome Unicode for YouTube */
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  -webkit-mask: radial-gradient(circle at center, transparent 55%, #000 56%);
  mask: radial-gradient(circle at center, transparent 55%, #000 56%);
  mix-blend-mode: lighten;
}
</style>
