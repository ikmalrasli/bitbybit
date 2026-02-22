<template>
    <div v-if="dialogStore.isVisible && dialogStore.dialogType === 'view-memo'" 
    class="p-4 fixed inset-0 z-40 bg-gray-600 bg-opacity-50 flex items-center justify-center"
    @click.self="closeDialog">
      <div class="flex flex-col bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative space-y-4">
        <!-- Header -->
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-semibold text-gray-700">
            {{dateA.toDate().toLocaleDateString('en-UK', { day: 'numeric', month: 'short', year: 'numeric' })}}</h2>
          <div class="flex space-x-4 items-center">
            <span class="material-icons cursor-pointer text-red-500" @click="deleteMemo">delete</span>
            <span class="material-icons cursor-pointer" @click="closeDialog">close</span>
          </div>
        </div>

        <!-- Content -->
        <p style="white-space: pre-wrap;">{{ dialogStore.content.memo }}</p>

        <div class="flex w-full flex-row justify-end">
          <span class="text-xs text-nowrap font-medium text-black text-opacity-50 rounded-full py-0.5 px-2 bg-black bg-opacity-5">
            {{ memoCategory(dialogStore.content.category) }}
          </span>
        </div>
      </div>
    </div>
  </template>
  
<script>
import { useDialogStore } from '../../store/dialogStore';
import { db } from "../../db"; // Dexie IndexedDB
import { mapState} from 'vuex';
  
export default {
  data() {
    return {
      dialogStore: useDialogStore(),
    };
  },
  computed: {
    ...mapState(['selectedDay']),
    dateA() {
      // Convert milliseconds back to Date for display
      return new Date(this.dialogStore.content.timestamp);
    }
  },
  methods: {
    memoCategory(category) {
      if (category === 'feeling') {
        return 'How I feel today'
      } else if (category === 'gratitude') {
        return 'Words of gratitude'
      } else if (category === 'deeds') {
        return 'Good deeds today'
      } else if (category === 'highlight') {
        return 'Hightlight of the day'
      } else {
        return 'Other'
      }
    },
    closeDialog() {
      this.dialogStore.closeDialog();
    },
    async deleteMemo() {
      try {
        const memoId = this.dialogStore.content.memoId;
        
        // Delete memo from Dexie (IndexedDB)
        await db.memos.delete(memoId);
        
        // Refresh week memos from Dexie
        await this.$store.dispatch('fetchWeekMemos');
      } catch (error) {
        console.error("Error deleting memo:", error);
        this.$toast.error({
          message: "Error deleting memo: " + error.message,
          duration: 2000,
        });
      } finally {
        this.closeDialog();
      }
    },
  },
};

</script>
  