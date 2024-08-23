<template>
  <div class="flex justify-center min-h-screen">
    <div class="flex w-full min-h-screen relative">
      <!-- Sidebar -->
      <Sidebar :show-sidebar="showSidebar" @toggle-sidebar="toggleSidebar" />

      <!-- Main Content Area -->
      <div :class="contentClass" class="w-1/2">
        <!-- Title Bar -->
        <TitleBar :title="currentTitle" @toggle-sidebar="toggleSidebar" @show-page="showRB = !showRB"/>
        
        <router-view class="h-full overflow-auto scrollbar-hide mb-8" />
      </div>
      
      <div v-if="checkDesktop()" class="w-1/2 flex">
        <addHabit class="flex-grow"/>
      </div>
      <div v-else class="w-1/2 flex">
        <Blank class="flex-grow"/>
      </div>

    </div>
  </div>  
</template>

<script>
import TitleBar from "./components/title-bar.vue";
import Sidebar from "./components/nav-bar.vue";
import Blank from "./views/p2/blank-p2.vue"
import addHabit from "./views/p2/add-habits-p2.vue"

export default {
  components: {
    TitleBar,
    Sidebar,
    Blank,
    addHabit
  },
  data() {
    return {
      showSidebar: false, // Controls sidebar visibility on mobile
      currentTitle: "", // Title to be updated based on route
      isMobile: false,
      showRB: false
    };
  },
  provide() {
    return {
      updateTitle: this.updateTitle, // Provide updateTitle method to child components
    };
  },
  computed: {
    contentClass() {
      return this.isMobile ? "w-full flex-grow px-4 pt-2 pb-4" : "w-full flex-grow p-4 ml-64"; // On desktop, add margin for the sidebar
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
    addPage(){
      return true;
    },
    checkDesktop(){
      if (window.innerWidth >= 768 && this.$route.path === "/") {
        return true;
      } else {
        return false;
      }
    },
  },
  mounted() {
    this.checkMobile();
    window.addEventListener("resize", this.checkMobile);

    // Set initial title
    this.updateTitle(this.$route.meta.title || "Default Title");

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
  overflow: hidden;
  justify-content: center;
}

#app {
  display: flex;
  flex-direction: column;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
</style>