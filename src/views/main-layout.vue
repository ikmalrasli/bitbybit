<template>
  <div class="flex relative justify-center min-h-screen h-full w-full">
    <!-- Sidebar -->
    <Sidebar :show-sidebar="showSidebar" @toggle-sidebar="toggleSidebar" class="h-full"/>

    <!-- Main Content Area -->
    <div v-if="!isMobile || !isDetailView" :class="contentClass" class="flex-1 border-l border-r relative">
      <!-- Title Bar stays on top within the container only if sidebar is closed -->
      <div :class="['z-50 bg-white', { 'sticky top-0': !showSidebar }]">
        <TitleBar @toggle-sidebar="toggleSidebar" />
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
      isMobile: false,
    };
  },
  computed: {
    isDetailView() {
      return (
        this.$route.name === 'add-habit' ||
        this.$route.name === 'edit-habit' ||
        this.$route.name === 'detail-habit' ||
        this.$route.name === 'detail-sunnah' ||
        this.$route.name === 'add-sunnah'
      );
    },
    contentClass() {
      return this.isMobile ? "px-4 pt-2 pb-4" : "ml-56"; // On desktop, add margin for the sidebar
    },
  },
  methods: {
    toggleSidebar() {
      this.showSidebar = !this.showSidebar;
    },
    checkMobile() {
      this.isMobile = window.innerWidth < 768;
    },
  },
  mounted() {
    this.checkMobile();
    window.addEventListener("resize", this.checkMobile);

    this.$router.beforeEach((to, from, next) => {
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
