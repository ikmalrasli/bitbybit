<template>
  <div class="flex w-full h-full">
    <!-- Sidebar -->
    <Sidebar :show-sidebar="showSidebar" @toggle-sidebar="toggleSidebar" />

    <!-- Main Content Area -->
    <div :class="contentClass">
      <!-- Title Bar -->
      <TitleBar :title="currentTitle" @toggle-sidebar="toggleSidebar" />
      
      <!-- Router View -->
      <router-view class="h-full overflow-auto scrollbar-hide"/>

    </div>
  </div>
</template>

<script>
import TitleBar from "./components/title-bar.vue";
import Sidebar from "./components/nav-bar.vue";

export default {
  components: {
    TitleBar,
    Sidebar,
  },
  data() {
    return {
      showSidebar: false, // Controls sidebar visibility on mobile
      currentTitle: "", // Title to be updated based on route
      isMobile: false,
    };
  },
  computed: {
    // Add margin when not in mobile mode to account for sidebar width
    contentClass() {
      return this.isMobile
        ? "flex-grow p-4"
        : "flex-grow p-4 ml-64"; // On desktop, add margin for the sidebar
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
  },
  mounted() {
    this.checkMobile();
    window.addEventListener("resize", this.checkMobile);

    this.$router.beforeEach((to, from, next) => {
      // Update title when route changes
      this.updateTitle(to.meta.title || "Default Title");
      
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

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background: white;
  overflow:hidden;
}

#app {
  display: flex;
  flex-direction: column;
}

.main-container {
  flex-grow: 1; /* Allow the main content area to grow */
  overflow-y: auto; /* Allow vertical scrolling */
  background-color: white; /* Ensure background color covers the entire area */
  min-height: 100%; /* Ensure container stretches to full height */
}

.flex {
  display: flex;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
</style>
