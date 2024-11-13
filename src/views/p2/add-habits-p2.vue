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
          <div>
            <label class="text-left block text-sm font-medium text-gray-700">Reminder</label>
            <button type="button" @click="setReminder" class="mt-1 bg-gray-300 text-gray-700 p-2 rounded-md w-full">Add a reminder</button>
          </div>

          <!-- Notes -->
          <div>
            <label for="notes" class="text-left block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              v-model="formData.notes"
              id="notes"
              ref="notesTextarea"
              class="bg-white text-black mt-1 block w-full p-2 border border-gray-300 rounded-md min-h-16 resize-none overflow-y-auto "
              :class="[
                'focus:ring-1 focus-within:' + `ring-${formData.color.active}`, 
                'focus-within:' + `border-${formData.color.active}`
              ]"
              placeholder="Optional"
              @input="adjustTextareaHeight"
            ></textarea>
          </div>

          <!-- Image Upload Button -->
          <div class="mt-2 flex justify-end gap-2">
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
              :class="{'bg-gray-300': !formData.imageUrl}" 
              :style="{ backgroundColor: formData.imageUrl ? formData.color : '#e5e7eb' }"
            >
              <span class="material-icons" :class="{'text-white': formData.imageUrl, 'text-gray-700': !formData.imageUrl}" >image</span>
            </button>
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
      <div class="sticky bottom-0 p-4">
        <button 
          @click="createEntry" 
          class="min-h-12 w-full text-white font-bold py-3 rounded-lg shadow-lg disabled:bg-gray-300"
          :class="[`bg-${formData.color.default}`, 'hover:'+ `bg-${formData.color.active}`, 'active:'+`bg-${formData.color.active}`]"
          :disabled="formData.name === ''"
        >
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
        termEnd: null,
        imageUrl: "",
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
      this.formData.termEnd = this.selectedHabit.termEnd ? this.selectedHabit.termEnd.toDate().toISOString().split("T")[0] : '';

      if (!this.selectedHabit.imageUrl) {
        this.selectedHabit.imageUrl = '';
      }
      this.formData.imageUrl = this.selectedHabit.imageUrl;
      this.imagePreviewUrl = this.selectedHabit.imageUrl;
      this.formData.reminder = this.selectedHabit.reminder;
      if (this.selectedHabit.color) {
        this.formData.color = { default: this.selectedHabit.color.default, active: this.selectedHabit.color.active };
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
    ...mapState(["selectedHabit"]),
  },
  methods: {
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
    setReminder() {
      this.$toast.info({
        message: 'Feature not available.',
        duration: 2000
      });
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
          this.isLoading = true;
          this.startLoadingDots();
          const imageUrl = await this.uploadImage();
          // console.log('imageUrl', '('+imageUrl+')', 'this.formData.imageUrl', this.formData.imageUrl);
          await updateDoc(doc(db, "habits", this.selectedHabit.habitId), {
            name: this.formData.name,
            dailyGoal: this.formData.dailyGoal,
            repeat: this.formData.repeatDays,
            notes: this.formData.notes,
            termStart: this.formData.termStart ? new Date(this.formData.termStart) : null,
            termEnd: this.formData.termEnd ? new Date(this.formData.termEnd) : null,
            reminder: this.formData.reminder,
            imageUrl: imageUrl || this.formData.imageUrl,
            color: this.formData.color,
          });
          
          this.$toast.info({
            message: "Habit updated!",
            duration: 2000
          });
        } catch (error) {
          this.$toast.error({
            message: "Error. Please try again.",
            duration: 2000
          });
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
          imageUrl: imageUrl || this.formData.imageUrl,
          color: this.formData.color,
        });

        this.$toast.success({
          message: "Habit created!",
          duration: 2000
        });
        
      } catch (error) {
        console.error("Error creating habit:", error);
        
        this.$toast.error({
          message: "Error. Please try again.",
          duration: 2000
        });
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
