<!-- BottomNavBar.vue -->
<template>
    <div class="w-full bg-white border-t">
      <div class="flex justify-between items-center py-2 px-4">
        <router-link
          v-for="link in links"
          :key="link.name"
          :to="link.path"
          class="flex flex-col items-center justify-center p-2 text-center"
          :class="isLinkActive(link.path) ? 'text-violet-400' : 'text-gray-600'"
        >
          <span class="material-icons" style="font-size: 24px; line-height: 24px;">{{ link.icon }}</span>
        </router-link>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        links: [
          { name: "Home", icon: "home", path: "/" },
          { name: "Calendar", icon: "calendar_today", path: "/calendar" },
          { name: "Sunnahs", icon: "explore", path: "/sunnahs" },
          { name: "Performance", icon: "bar_chart", path: "/stats" },
          { name: "Settings", icon: "settings", path: "/settings" },
        ],
        isMobile: false,
      };
    },
    methods: {
      checkMobile() {
        this.isMobile = window.innerWidth < 768;
      },
      isLinkActive(linkPath) {
        return this.$route.path === linkPath || this.$route.path.startsWith(linkPath + "/");
      }
    },
    mounted() {
      this.checkMobile();
      window.addEventListener('resize', this.checkMobile);
    },
    beforeUnmount() {
      window.removeEventListener('resize', this.checkMobile);
    }
  };
  </script>
  
  <style scoped>
  /* Add any styles you need */
  </style>
  