<template>
  <div class="w-full flex justify-between items-center bg-white px-4 py-2 h-14">
    <!-- Sidebar Toggle Button for Mobile -->
    <span v-if="!this.selectionMode" @click="toggleSidebar" class="material-icons cursor-pointer md:invisible ">
      menu
    </span>
    <span v-else @click="toggleSidebar" class="font-bold text-xl text-gray-700">
      Select Habits
    </span>
    <!-- Title (Centered) -->
    <div v-if="!this.selectionMode" class="text-center font-bold text-xl">
      {{ displayTitle }}
    </div>
    <!-- Add Button (Dropdown add menu) -->
    <div v-if="showAdd() && !this.selectionMode" class="relative">
      <!-- Dropdown Toggle Button -->
      <button @click="toggleDropdown" class="material-icons rounded-full active:bg-gray-200">more_horiz</button>

      <!-- Dropdown Menu -->
      <div v-if="isDropdownOpen" class="absolute right-0 z-10 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200" @click.stop>
        <ul class="py-1 text-gray-700">
          <li @click="selectHabits" class="grid grid-cols-[auto,1fr] items-center px-4 py-2 text-md hover:bg-gray-100 cursor-pointer">
            <span class="material-icons">check_circle</span>
            <span class="pl-4 w-full">Select habits</span>
          </li>
          <li @click="sortBy" class="grid grid-cols-[auto,1fr] items-center px-4 py-2 text-md hover:bg-gray-100 cursor-pointer">
            <span class="material-icons">sort</span>
            <span class="pl-4 w-full">Sort by</span>
          </li>
        </ul>
      </div>
    </div>
    <button v-else-if="showAdd() && this.selectionMode" 
    class="cursor-pointer font-bold text-gray-700"
    @click="closeSelectionMode">
      Done
    </button>
    <button v-else class="material-icons invisible">add</button>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { mapState } from 'vuex';
import { useDialogStore } from '../store/dialogStore';

export default {
  data() {
    return {
      dialogStore: useDialogStore(),
      isDropdownOpen: false,
    };
  },
  computed: {
    ...mapGetters(['getSelectedDay']), // Map the Vuex getter
    ...mapState(['selectionMode']),
    closeSelectionMode() {
      this.$store.commit('toggleSelectionMode');
    },
    displayTitle() {
      if (this.$route.name === "home" ||  
      this.$route.name === "add-habit" ||
      this.$route.name === "detail-habit" ||
      this.$route.name === "edit-habit" ||
      this.$route.name === "add-memo") {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        const selectedDate = new Date(this.getSelectedDay);
        selectedDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        yesterday.setHours(0, 0, 0, 0);
        
        let formattedDate;
        if (selectedDate.getTime() === today.getTime()) {
          formattedDate = "Today";
        } else if (selectedDate.getTime() === yesterday.getTime()) {
          formattedDate = "Yesterday";
        } else {
          // i want month in short form like Jan
          formattedDate = `${selectedDate.getDate()} ${selectedDate.toLocaleString("en-US", { month: "short" })}`;
        }

        return formattedDate; // Use the globally selected date
      }

      if (this.$route.name === "sunnahs" ||  
      this.$route.name === "detail-sunnah" ||
      this.$route.name === "add-sunnah") {
        return "Sunnahs";
      }

      if (this.$route.name === "stats" ||
      this.$route.name === "detail-stats"
      ) {
        return "Performance"
      }

      if (
      this.$route.name === "settings" ||  
      this.$route.name === "account" ||
      this.$route.name === "about" ||
      this.$route.name === "news"
      ) {
        return "Settings"
      }

      return this.$route.meta.title; 
    }
  },
  methods: {
    toggleSidebar() {
      this.$emit("toggle-sidebar");
    },
    showAdd() {
      return this.$route.name === "home" || 
      this.$route.name === "detail-habit";
    },
    toggleDropdown(event) {
      event.stopPropagation(); // Prevent the outside click listener from being triggered
      this.isDropdownOpen = !this.isDropdownOpen;

      // If the dropdown is open, add the click listener to detect clicks outside
      if (this.isDropdownOpen) {
        document.addEventListener('click', this.handleClickOutside);
      } else {
        document.removeEventListener('click', this.handleClickOutside);
      }
    },
    handleClickOutside(event) {
      const dropdown = this.$el.querySelector('.absolute');
      if (dropdown && !dropdown.contains(event.target)) {
        this.isDropdownOpen = false;  // Close dropdown
        document.removeEventListener('click', this.handleClickOutside); // Remove the event listener
      }
    },
    selectHabits() {
      this.$store.dispatch('toggleSelectionMode');
      this.isDropdownOpen = false;
      document.removeEventListener('click', this.handleClickOutside);
    },
    sortBy() {
      this.$toast.info({
            message: 'Sort by feature not implemented yet!',
            duration: 2500
          });
      this.isDropdownOpen = false;
      document.removeEventListener('click', this.handleClickOutside);
    },
    showWeekMonth() {
      return this.$route.name === "stats";
    },
    toggleWeekMonth() {
      this.$toast.info({
            message: 'Feature not implemented yet!',
            duration: 2000
          });
    },
  }
};
</script>

<style scoped>
.hover\:bg-slate-100:hover {
  background-color: #f3f4f6;
}
</style>
