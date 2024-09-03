<template>
  <div class="flex relative justify-center min-h-screen h-full w-full">
    <!-- Sidebar -->
    <Sidebar :show-sidebar="showSidebar" @toggle-sidebar="toggleSidebar" class="h-full"/>

    <!-- Main Content Area -->
    <div v-if="!isMobile || !isDetailView" :class="contentClass" class="flex-1 border relative">
      <!-- Title Bar stays on top within the container only if sidebar is closed -->
      <div :class="['z-50 bg-white', { 'sticky top-0': !showSidebar }]">
        <TitleBar :title="currentTitle" @toggle-sidebar="toggleSidebar" />
      </div>
      
      <!-- Content below the title bar -->
      <div class="h-auto overflow-auto scrollbar-hide mb-8">
        <router-view />
      </div>
    </div>
    
    <!-- Right Detail View -->
    <div v-if="!isMobile || isDetailView" class="flex-1 border-gray-200">
      <router-view class="w-full" name="right" />
    </div>
  </div>  
</template>

<script>
import TitleBar from "../components/title-bar.vue";
import Sidebar from "../components/nav-bar.vue";

export default {
  components: {
    TitleBar,
    Sidebar
  },
  data() {
    return {
      showSidebar: false,
      currentTitle: "",
      selectedDate: "Today", // Default to "Today"
      isMobile: false,
    };
  },
  provide() {
    return {
      updateTitle: this.updateTitle,
      selectedDate: () => this.selectedDate, // Provide selectedDate globally
      setSelectedDate: this.setSelectedDate, // Method to update the selected date
    };
  },
  computed: {
    isDetailView() {
      return (
        this.$route.name === 'add-habit' ||
        this.$route.name === 'detail-habit' ||
        this.$route.name === 'detail-sunnah'
      );
    },
    contentClass() {
      return this.isMobile ? "px-4 pt-2 pb-4" : "ml-60"; // On desktop, add margin for the sidebar
    },
  },
  methods: {
    toggleSidebar() {
      this.showSidebar = !this.showSidebar;
    },
    checkMobile() {
      this.isMobile = window.innerWidth < 768;
    },
    updateTitle(newTitle) {
      this.currentTitle = newTitle;
    },
    setSelectedDate(newDate) {
      this.selectedDate = newDate;
    },
    handleDateSelected(date) {
      this.setSelectedDate(date); // Update the global selected date
      this.updateTitle(date); // Update the title
    },
  },
  mounted() {
    this.checkMobile();
    window.addEventListener("resize", this.checkMobile);

    // Set initial title
    this.updateTitle(this.selectedDate);

    this.$router.beforeEach((to, from, next) => {
      if (to.meta.title) {
        this.updateTitle(to.meta.title);
      } else if (to.path === "/") {
        this.updateTitle(this.selectedDate); // Keep the selected date as title for home routes
      }

      // Close sidebar on mobile when route changes
      if (this.showSidebar && this.isMobile) {
        this.showSidebar = false;
      }
      next();
    });
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.checkMobile);
  },
};
</script>
