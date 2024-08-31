<template>
  <div class="flex relative justify-center min-h-screen h-full w-full">
    <!-- Sidebar -->
    <Sidebar :show-sidebar="showSidebar" @toggle-sidebar="toggleSidebar" class="h-full"/>

    <!-- Main Content Area -->
    <div v-if="!isMobile || !isDetailView" :class="contentClass" class="flex-1 border">
      <TitleBar :title="currentTitle" @toggle-sidebar="toggleSidebar" />
      <router-view class="h-auto overflow-auto scrollbar-hide mb-8" />
    </div>
    
    <!-- Right Detail View -->
    <div  v-if="!isMobile || isDetailView" class="flex-1 border-gray-200">
      <router-view class="w-full" name="right" />
    </div>
  </div>  
</template>
  
  <script>
  import TitleBar from "../components/title-bar.vue";
  import Sidebar from "../components/nav-bar.vue";
  import Blank from "../views/p2/blank-p2.vue"
  import addHabit from "../views/p2/add-habits-p2.vue"
  
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
      };
    },
    provide() {
      return {
        updateTitle: this.updateTitle, // Provide updateTitle method to child components
      };
    },
    computed: {
      isDetailView() {
      // Return true if the current path is a detail view (like /home/add-habit)
        if (
          this.$route.name === 'add-habit' ||
          this.$route.name === 'detail-habits'
        ){
          return true
        }
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
      checkDesktop(){
        if (window.innerWidth >= 768) {
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
    .scrollbar-hide::-webkit-scrollbar {
    display: none;
    }

    .scrollbar-hide {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
    }
</style>