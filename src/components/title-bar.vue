<template>
  <div class="w-full flex justify-between items-center bg-white px-4 py-2 h-14">
    <!-- Sidebar Toggle Button for Mobile -->
    <span @click="toggleSidebar" class="material-icons cursor-pointer md:invisible ">
      menu
    </span>
    <!-- Title (Centered) -->
    <div class="text-center font-bold text-xl">
      {{ displayTitle }}
    </div>
    <button v-if="showAdd()" @click="openAddPage" class="cursor-pointer material-icons">
      add
    </button>
    <button v-else class="material-icons invisible">add</button>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  computed: {
    ...mapGetters(['getSelectedDay']), // Map the Vuex getter
    displayTitle() {
      if (this.$route.name === "home" ||  
      this.$route.name === "add-habit" ||
      this.$route.name === "detail-habit") {
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
      return this.$route.meta.title; // Otherwise, use the meta title
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
    openAddPage() {
      this.$store.commit('setSelectedSunnah', null);
      this.$router.push('/add-habit');
    }
  }
};
</script>

<style scoped>
.hover\:bg-slate-100:hover {
  background-color: #f3f4f6;
}
</style>
