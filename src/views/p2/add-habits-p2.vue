<template>
  <div class="w-full h-full flex flex-row">
    <div class="w-full h-full flex flex-col bg-white">
      <!-- Header -->
      <header class="bg-white p-4 flex flex-row relative">
        <button @click="goBack" class="material-icons">chevron_left</button>
        <h1 class="text-lg text-black font-bold absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">{{ formData.name === '' ? title : formData.name }}</h1>
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
            <div class="mt-1 flex items-center justify-center space-x-2">
              <button type="button" @click="decreaseGoal" class="material-icons bg-violet-400 text-white p-2 rounded-full hover:bg-violet-500">remove</button>
              <input v-model="formData.dailyGoal" type="number" id="dailyGoal" class="no-arrows bg-white text-black w-12 p-2 border border-gray-300 rounded-md text-center"/>
              <button type="button" @click="increaseGoal" class="material-icons bg-violet-400 text-white p-2 rounded-full hover:bg-violet-500">add</button>
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
          <div>
            <label class="text-left block text-sm font-medium text-gray-700">Reminder</label>
            <button type="button" @click="setReminder" class="mt-1 bg-gray-300 text-gray-700 p-2 rounded-md w-full">Add a reminder</button>
          </div>

          <!-- Notes -->
          <div>
            <label for="notes" class="text-left block text-sm font-medium text-gray-700">Notes</label>
            <textarea v-model="formData.notes" id="notes" class="bg-white text-black mt-1 block w-full p-2 border border-gray-300 rounded-md min-h-16" placeholder="Optional"></textarea>
          </div>

          <!-- Image Upload Button -->
          <div class="mt-2 flex justify-end gap-2">
            <!-- Display Selected Image Thumbnail -->
            <div v-if="formData.imageUrl" class="flex items-center border rounded-md content-center text-sm">
              <img :src="imagePreviewUrl" alt="Selected Image" class="h-10 w-10 object-cover rounded-md" />
              <span class="ml-2">{{ formatFileName(formData.imageUrl) }}</span>
              <button @click="removeImage" class="ml-2 text-black text-sm">
                <span class="material-icons">close</span>
              </button>
            </div>

            <input type="file" @change="onFileSelected" ref="fileInput" class="hidden" />

            <button 
              type="button" 
              @click="triggerFileInput" 
              class="bg-gray-300 text-gray-700 p-2 rounded-full h-10 w-10 flex justify-center items-center transition-colors duration-200"
              :class="{'bg-violet-400': formData.imageUrl, 'bg-gray-300': !formData.imageUrl}" 
            >
              <span class="material-icons" :class="{'text-white': formData.imageUrl, 'text-gray-700': !formData.imageUrl}" >image</span>
            </button>
          </div>

          <!-- Term -->
          <div class="flex space-x-2">
            <div class="w-1/2">
              <label for="term-start" class="text-center block text-sm font-medium text-gray-700">Start</label>
              <input v-model="formData.termStart" type="date" id="term-start" class="bg-white text-black mt-1 block w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <div class="w-1/2">
              <label for="term-end" class="text-center block text-sm font-medium text-gray-700">End</label>
              <input v-model="formData.termEnd" type="date" id="term-end" class="bg-white text-black mt-1 block w-full p-2 border border-gray-300 rounded-md" placeholder="Leave empty for no end" />
            </div>
          </div>
        </form>
      </div>

      <!-- Floating Create Button -->
      <div class="sticky bottom-0 p-4">
        <button @click="createEntry" class="min-h-12 w-full bg-violet-400 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-violet-500">
          {{ buttonText }} 
        </button>
      </div>
    </div>
  </div>  
</template>

<script>
import { db } from "../../firebase"; // Firestore instance
import { collection, addDoc, updateDoc, doc } from "firebase/firestore"; // Firestore methods
import { getAuth } from "firebase/auth"; // Firebase Authentication
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"; // Firebase Storage
import { mapState } from "vuex";

export default {
  data() {
    return {
      title: "Add Habits",
      formData: {
        name: "",
        dailyGoal: 1,
        repeatDays: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: true },
        reminder: null,
        notes: "",
        termStart: new Date().toISOString().split("T")[0], // Default to today
        termEnd: "",
        imageUrl: "", // New field for storing image URL
      },
      days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      selectedFile: null, // To store the selected image file
      imagePreviewUrl: "", // To store the image preview URL
      isLoading: false, // Loading state for the button
      loadingText: 'Create', // Initial button text
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
      this.formData.termStart = this.selectedHabit.termStart ? this.selectedHabit.termStart.toDate().toISOString().split("T")[0] : '';
      this.formData.imageUrl = this.selectedHabit.imageUrl;
      this.imagePreviewUrl = this.selectedHabit.imageUrl;
    }
  },
  computed: {
    buttonText() {
      if (this.$route.name === 'edit-habit') {
        return this.isLoading ? this.loadingText : 'Apply';
      }
      return this.isLoading ? this.loadingText : 'Create'; // Toggle text based on loading state
    },
    ...mapState(["selectedHabit"]),
  },
  methods: {
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
    setReminder() {
      alert("Reminder feature not implemented yet!");
    },
    triggerFileInput() {
      this.$refs.fileInput.click(); // Trigger the hidden file input click
    },
    onFileSelected(event) {
      this.selectedFile = event.target.files[0];
      if (this.selectedFile) {
        this.formData.imageUrl = this.selectedFile.name; // Show the selected file name
        this.imagePreviewUrl = URL.createObjectURL(this.selectedFile); // Create a preview URL
      }
    },
    formatFileName(fileName) {
      const maxLength = 10; // Maximum length before truncating
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
    async createEntry() {
      //edit habit section
      if (this.$route.name === 'edit-habit') {
        try {
          this.isLoading = true; // Set loading state to true
          this.startLoadingDots();
          const imageUrl = await this.uploadImage();
          await updateDoc(doc(db, "habits", this.selectedHabit.habitId), {
            name: this.formData.name,
            dailyGoal: this.formData.dailyGoal,
            repeat: this.formData.repeatDays,
            notes: this.formData.notes,
            termStart: this.formData.termStart ? new Date(this.formData.termStart) : null,
            termEnd: this.formData.termEnd ? new Date(this.formData.termEnd) : null,
            reminder: this.formData.reminder,
            imageUrl: imageUrl || this.formData.imageUrl, // Save image URL in Firestore if it exists
          });

          alert("Habit updated successfully!");
        } catch (error) {
          console.error("Error updating habit:", error);
        } finally {
          this.isLoading = false; // Reset loading state
          this.loadingText = 'Apply'; // Reset button text
          this.goBack();
        }
        return
      }

      //create habit section
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          throw new Error("User not authenticated. Please log in.");
        }

        // Upload the image if one is selected and get the download URL
        const imageUrl = await this.uploadImage();

        // Step 1: Add the habit to the "habits" collection with userId and image URL
        const habitRef = await addDoc(collection(db, "habits"), {
          userId: user.uid,
          name: this.formData.name,
          dailyGoal: this.formData.dailyGoal,
          reminder: this.formData.reminder,
          notes: this.formData.notes,
          termStart: this.formData.termStart ? new Date(this.formData.termStart) : null,
          termEnd: this.formData.termEnd ? new Date(this.formData.termEnd) : null,
          createdAt: new Date(),
          repeat: this.formData.repeatDays,
          imageUrl: imageUrl || this.formData.imageUrl, // Save image URL in Firestore if it exists
        });

        console.log("Habit created successfully with userId:", user.uid);
        alert("Habit created successfully!");
      } catch (error) {
        console.error("Error creating habit:", error);
        alert("Error creating habit: " + error.message);
      } finally {
        this.isLoading = false; // Reset loading state
        this.loadingText = 'Create'; // Reset button text
        this.goBack();
      }
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

</style>
