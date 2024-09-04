<template>
  <div class="flex justify-center h-full">
    <router-view/>
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
    };
  },
  provide() {
    return {
      updateTitle: this.updateTitle, // Provide updateTitle method to child components
    };
  },
  computed: {
    contentClass() {
      return this.isMobile ? "flex-grow px-4 pt-2 pb-4" : "flex-auto ml-64"; // On desktop, add margin for the sidebar
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
  created() {
    this.$store.dispatch('fetchUser');
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