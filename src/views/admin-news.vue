<template>
    <div
    class="p-4 fixed inset-0 z-50 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div class="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-700">Add News</h2>
        </div>

        <!-- Form Content -->
        <div class="flex-1 overflow-y-auto mb-4">
          <form @submit.prevent="createEntry" class="space-y-2">
            <!-- Name Field -->
            <div class="flex-1">
              <label for="name" class="text-left block text-sm font-medium text-gray-700">Title</label>
              <input 
                v-model="formData.title" 
                type="text" 
                id="name" 
                class="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none" 
                autocomplete="off" 
              />
            </div>

            <!-- Memo -->
            <div>
              <label for="date" class="block text-sm font-medium text-gray-700">Content</label>
              <textarea
                id="memo"
                v-model="formData.content"
                ref="notesTextarea"
                class="leading-tight bg-white text-black block w-full p-2 border border-gray-300 rounded-md min-h-24 resize-none overflow-y-auto "
                @input="adjustTextareaHeight"
              ></textarea>
            </div>

            <div class="w-full flex space-x-6 items-center">
              <label for="category" class="block text-sm font-medium text-gray-700">Category</label>
              <select v-model="formData.category" id="category" class="bg-white text-black mt-1 block flex-grow p-2 border border-gray-300 rounded-md">
                <option value="news">News</option>
                <option value="updates">Updates</option>
                <option value="bug fixes">Bug Fixes</option>
                <option value="guides">Guides</option>
              </select>
            </div>
  
            <div class="w-full flex space-x-6 items-center">
              <label for="date" class="block text-sm font-medium text-gray-700">Date</label>
              <input v-model="formData.date" type="date" id="date" class="bg-white text-black mt-1 block flex-grow p-2 border border-gray-300 rounded-md" />
            </div>
            
          </form>
        </div>
        <div class="mt-6 flex justify-center space-x-3">
          <button @click="createEntry" class="min-w-24 bg-violet-400 text-white font-semibold px-4 py-2 rounded-lg hover:bg-violet-500">OK</button>
          <button @click="closeDialog" class="min-w-24 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100">Cancel</button>
        </div>
      </div>
      <Toast/>
    </div>
  </template>
  
<script>
import { useDialogStore } from '../store/dialogStore';
import { db } from "../firebase";
import { collection, addDoc} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Toast from "../components/toast-noti.vue";
  
export default {
  components: {
    Toast
  },
  data() {
    return {
      dialogStore: useDialogStore(),
      formData: {
        title: "",
        content: "",
        category: "news",
        date: new Date().toISOString().split("T")[0],
      },
    };
  },
  methods: {
    adjustTextareaHeight() {
      const textarea = this.$refs.notesTextarea;
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    },
    async createEntry() {
      try {
        this.loading = true;
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          throw new Error("User not authenticated. Please log in.");
        }
        
        await addDoc(collection(db, "news"), {
          title: this.formData.title,
          content: this.formData.content,
          date: new Date(this.formData.date),
          category: this.formData.category
        });

        this.$toast.success({
          message: "News published successfully!",
          duration: 2000,
        });
      } catch (error) {
        this.loading = false;
        console.error("Error publishing news:", error);
        this.$toast.error({
          message: "Error publishing news: " + error.message,
          duration: 2000,
        });
      } finally {
        this.resetDialog();
      }
    },
    resetDialog() {
      this.formData.title = "";
      this.formData.content = "";
      this.formData.date = new Date().toISOString().split("T")[0];
    },
    closeDialog() {
      this.$router.push('/');
    },
  },
};

</script>
  