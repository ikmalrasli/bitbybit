<template>
    <div v-if="dialogStore.isVisible && dialogStore.dialogType === 'add-memo'" 
    class="p-4 fixed inset-0 z-40 bg-gray-600 bg-opacity-50 flex items-center justify-center"
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
import { useDialogStore } from '../../store/dialogStore';
import { memoService } from '../../services/memoService';
import { useUserStore } from '../../store/userStore';
import { useMemoStore } from '../../store/memoStore';
import { useUIStore } from '../../store/uiStore';
  
export default {
  data() {
    return {
      userStore: useUserStore(),
      dialogStore: useDialogStore(),
      uiStore: useUIStore(),
      formData: {
        memo: "",
        date: "",
        category: "feeling",
      },
      loading: false,
    };
  },
  computed: {
    selectedDay() {
      return this.uiStore.selectedDate;
    },
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
        const userId = this.userStore.getUserId;

        if (!userId) {
          throw new Error("User not authenticated. Please log in.");
        }
        
        // Create timestamp with appropriate time
        const selectedDate = new Date(this.formData.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        
        let timestamp;
        if (selectedDate.getTime() === today.getTime()) {
          // If today, use current time
          timestamp = new Date();
        } else {
          // If previous day, set to 23:59:59
          timestamp = new Date(this.formData.date);
          timestamp.setHours(23, 59, 59, 999);
        }

        const result = await memoService.addMemo({
          userId: userId,
          memo: this.formData.memo,
          timestamp: timestamp,
          category: this.formData.category
        });

        // Refetch memos to update UI
        if (result.refetchData) {
          const memoStore = useMemoStore();
          await memoStore.getMemos(result.refetchData.start, result.refetchData.end);
        }

        // Note: firstFetchWeekMemos was Vuex state, now handled by memoStore
        // The memoStore.getMemos call above already handles fetching
        
        this.$toast.success({
          message: "Memo created successfully!",
          duration: 2000,
        });
      } catch (error) {
        console.error("Error creating memo:", error);
        this.$toast.error({
          message: "Error creating memo: " + error.message,
          duration: 2000,
        });
      } finally {
        this.loading = false;
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
  