<template>
  <div
    v-if="isExpanded"
    class="fixed inset-0 bg-gray-600 bg-opacity-30 z-10"
    @click="toggleExpand"
  ></div>
  
  <div class="fixed bottom-6 right-6 flex flex-col items-end gap-2 z-20">
    <transition-group name="fade">
      <!-- Add Habit Button -->
      <button
        v-if="isExpanded && !selectionMode"
        class="p-4 h-14 w-48 rounded-full bg-white text-gray-700 shadow-lg transition-all duration-300 ease-in-out flex items-center justify-start"
        @click="addHabit"
      >
        <span class="material-icons mr-2">add_circle</span>
        <span>Add Habit</span>
      </button>
      <!-- Add Memo Button -->
      <button
        v-if="isExpanded && !selectionMode"
        class="p-4 h-14 w-48 rounded-full bg-white text-gray-700 shadow-lg transition-all duration-300 ease-in-out flex items-center justify-start"
        @click="addMemo"
      >
        <span class="material-icons mr-2">note_add</span>
        <span>Add Daily Memo</span>
      </button>
    </transition-group>

    <!-- Toggle FAB button -->
    <button
      v-if="!selectionMode"
      class="material-icons h-16 w-16 rounded-full bg-violet-400 text-white shadow-lg transition-all duration-300 ease-in-out hover:bg-primary/90 flex items-center justify-center"
      :class="{ 'rotate-45': isExpanded }"
      @click="toggleExpand"
      :aria-label="isExpanded ? 'Close menu' : 'Open menu'"
      :aria-expanded="isExpanded"
    >
      add
    </button>

    <!-- Mark as Completed Button (only in selectionMode) -->
    <button
      v-else
      class="p-4 h-14 w-56 rounded-full bg-violet-400 text-white shadow-lg transition-all duration-300 ease-in-out flex items-center justify-center disabled:bg-gray-200 disabled:text-gray-700"
      @click="markAsCompleted"
      :disabled="this.selectedHabits.length === 0"
    >
      <span class="material-icons mr-2">check</span>
      <span>Mark as Completed</span>
    </button>
  </div>
</template>

<script>
import { useDialogStore } from '../store/dialogStore';
import { mapState } from 'vuex';

export default {
  data() {
    return {
      isExpanded: false,
      dialogStore: useDialogStore(),
    };
  },
  computed: {
    ...mapState(['selectionMode', 'selectedHabits']),
  },
  methods: {
    toggleExpand() {
      this.isExpanded = !this.isExpanded;
    },
    addHabit() {
      this.$router.push('/add-habit');
      this.isExpanded = false;
    },
    addMemo() {
      this.dialogStore.openAddMemoDialog();
      this.isExpanded = false;
    },
    markAsCompleted() {
      this.$store.dispatch('markHabitsCompleted',  this.$toast); // Your Vuex action for marking as completed
      this.isExpanded = false;
    }
  },
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
