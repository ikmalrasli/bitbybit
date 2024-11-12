<template>
    <div v-if="dialogStore.isVisible && dialogStore.dialogType === 'add-memo'" 
    class="p-4 fixed inset-0 z-50 bg-gray-600 bg-opacity-50 flex items-center justify-center"
    @click.self="closeDialog">
      <div class="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-700">Add Daily Memo</h2>
        </div>
        <!-- Form Content -->
        <div class="flex-1 overflow-y-auto mb-4">
          <form @submit.prevent="createEntry" class="space-y-2">
            <!-- Memo -->
            <div>
              <textarea
                id="memo"
                v-model="formData.memo"
                ref="notesTextarea"
                class="bg-white text-black block w-full p-2 border border-gray-300 rounded-md min-h-24 resize-none overflow-y-auto "
                placeholder="Type something here"
                @input="adjustTextareaHeight"
              ></textarea>
            </div>
  
            <div class="w-full flex space-x-6 items-center">
              <label for="date" class="block text-sm font-medium text-gray-700">Date</label>
              <input v-model="formData.date" type="date" id="date" class="bg-white text-black mt-1 block flex-grow p-2 border border-gray-300 rounded-md" />
            </div>

            <div class="w-full flex space-x-6 items-center">
              <label for="category" class="block text-sm font-medium text-gray-700">Category</label>
              <select v-model="formData.category" id="category" class="bg-white text-black mt-1 block flex-grow p-2 border border-gray-300 rounded-md">
                <option value="feeling">How I feel today</option>
                <option value="gratitude">Words of gratitude</option>
                <option value="deeds">Good Deeds Today</option>
                <option value="highlight">Highlight of the day</option>
                <option value="other">Other</option>
              </select>
            </div>
            
          </form>
        </div>
        <div class="mt-6 flex justify-center space-x-3">
          <button @click="createEntry" class="min-w-24 bg-violet-400 text-white font-semibold px-4 py-2 rounded-lg hover:bg-violet-500">OK</button>
          <button @click="closeDialog" class="min-w-24 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100">Cancel</button>
        </div>
      </div>
    </div>
  </template>
  
<script>
import { useDialogStore } from '../store/dialogStore';
import { db } from "../firebase";
import { collection, addDoc} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { mapState} from 'vuex';
  
export default {
  data() {
    return {
      dialogStore: useDialogStore(),
      formData: {
        memo: "",
        date: "",
        category: "feeling",
      },
      loading: false,
    };
  },
  computed: {
    ...mapState(['selectedDay']),
    computedDate() {
      return new Date(this.selectedDay).toISOString().split("T")[0];
    },
  },
  watch: {
    selectedDay(newVal) {
      // Update date if it's not modified by the user
      this.formData.date = this.computedDate;
    },
  },
  mounted() {
    // Initialize formData.date with the computed date on mount
    this.formData.date = this.computedDate;
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
        
        await addDoc(collection(db, "memos"), {
          userId: user.uid,
          memo: this.formData.memo,
          timestamp: new Date(this.formData.date),
          category: this.formData.category
        });
        
        this.loading = false;
        this.$toast.success({
          message: "Memo created successfully!",
          duration: 2000,
        });
      } catch (error) {
        this.loading = false;
        console.error("Error creating memo:", error);
        this.$toast.error({
          message: "Error creating memo: " + error.message,
          duration: 2000,
        });
      } finally {
        this.closeDialog();
      }
    },
    closeDialog() {
      this.dialogStore.closeDialog();
      this.formData.memo = "";
      this.formData.date = this.computedDate;
      this.formData.category = "feeling";
    },
  },
};

</script>
  