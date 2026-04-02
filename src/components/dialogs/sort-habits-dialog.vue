<template>
  <div v-if="dialogStore.isVisible && dialogStore.dialogType === 'sort-habits'" 
    class="p-4 fixed inset-0 z-40 bg-gray-600 bg-opacity-50 flex items-center justify-center"
    @click.self="dialogStore.closeDialog">
    
    <div class="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold">Sort Habits</h2>
        <select v-model="type" class="bg-white text-black mt-1 block p-2 border border-gray-300 rounded-md"
          @change="sortHabits">
          <option value="name">Name</option>
          <option value="color">Color</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      
      <div class="mb-4 space-y-2 overflow-y-auto max-h-96"
      style="scrollbar-width: thin;">
        <draggable v-if="isCustom" v-model="localHabits" item-key="id" handle=".drag-handle" @end="saveCustomOrder">
          <template #item="{ element: habit }">
            <div class="mb-2 w-full min-h-18 p-4 bg-white border rounded-lg shadow-sm flex flex-row items-center justify-between cursor-pointer">
              <div class="flex flex-row items-center flex-grow">
                <div class="h-3 w-3 md:h-4 md:w-4" :class="habit.color ? `fill-${habit.color.default}` : 'fill-violet-400'">
                  <svg class="h-full w-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" />
                  </svg>
                </div>
                <h2 class="p-2 font-semibold w-full">{{ habit.name }}</h2>
              </div>
              <span class="pl-4 text-right material-icons drag-handle text-gray-400">drag_handle</span>
            </div>
          </template>
        </draggable>

        <!-- Display habits without drag-and-drop if not in custom mode -->
        <div v-else v-for="habit in localHabits" :key="habit.id">
          <div class="w-full min-h-18 p-4 bg-white border rounded-lg shadow-sm flex flex-row items-center justify-between">
            <div class="flex flex-row items-center">
              <div class="h-3 w-3 md:h-4 md:w-4" :class="habit.color ? `fill-${habit.color.default}` : 'fill-violet-400'">
                <svg class="h-full w-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" />
                </svg>
              </div>
              <h2 class="p-2 font-semibold w-full">{{ habit.name }}</h2>
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex justify-center space-x-3">
        <button @click="confirmAction" class="font-bold px-4 py-2 rounded hover:bg-gray-100">OK</button>
        <button @click="dialogStore.closeDialog" class="text-gray-700 px-4 py-2 rounded hover:bg-gray-100">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script>
import { useDialogStore } from '../../store/dialogStore';
import { useHabitStore } from '../../store/habitStore';
import { useUIStore } from '../../store/uiStore';
import { useUserStore } from '../../store/userStore';
import draggable from 'vuedraggable';
import { habitService } from '../../services/habitService';

export default {
  components: { draggable },
  data() {
    return { 
      dialogStore: useDialogStore(),
      habitStore: useHabitStore(),
      uiStore: useUIStore(),
      userStore: useUserStore(),
      type: '',
      isCustom: false,
      localHabits: [] // Local copy of habits
    };
  },
  methods: {
    async sortHabits(evt) {
      if (evt.target.value === "name") {
        this.uiStore.setSortType('name');
        this.localHabits = await this.habitStore.sortHabits('name');
        this.isCustom = false;
      } else if (evt.target.value === "color") {
        this.uiStore.setSortType('color');
        this.localHabits = await this.habitStore.sortHabits('color');
        this.isCustom = false;
      } else if (evt.target.value === "custom") {
        this.isCustom = true;
        this.localHabits = await this.habitStore.sortHabits('custom');
      }
    },
    saveCustomOrder() {
      const updatedOrder = this.localHabits.map((habit, index) => ({ ...habit, index: index }));
      this.localHabits = updatedOrder;
    },
    async confirmAction() {
      if (this.type === 'custom') {
        // Update habits in IndexedDB instead of Firebase
        for (let i = 0; i < this.localHabits.length; i++) {
          const habit = this.localHabits[i];
          await habitService.updateHabitDetails(habit.id, {
            index: i
          });
        }
        this.uiStore.setSortType('custom');
      }
      
      // Refresh the habits data
      await this.habitStore.refreshMetrics();
      this.dialogStore.closeDialog();
    },
  },
  async mounted() {
    this.type = this.uiStore.sortType;
    if (this.type === 'custom') {
      this.isCustom = true;
    }
    
    // Get initial habits data
    const habits = await this.habitStore.sortHabits(this.type);
    this.localHabits = [...habits];
  }
};
</script>
