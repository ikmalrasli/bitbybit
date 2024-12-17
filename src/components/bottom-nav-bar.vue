<!-- BottomNavBar.vue -->
<template>
  <div :class="['w-full bg-white border-t', iosPaddingClass]">
    <div class="flex justify-between items-center py-2 px-6">
      <router-link
        v-for="link in links"
        :key="link.name"
        :to="link.path"
        class="flex flex-col items-center justify-center p-2 text-center"
        :class="isLinkActive(link.path) ? 'text-violet-400' : 'text-gray-600'"
      >
        <i :class="link.fa_icon" class="text-2xl"></i>
        <!--<span class="material-icons-round">{{ link.icon }}</span>-->
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      links: [
        { name: "Home", icon: "home", fa_icon: "fas fa-home", path: "/" },
        { name: "Calendar", icon: "calendar_today", fa_icon: "fas fa-calendar", path: "/calendar" },
        { name: "Sunnahs", icon: "explore", fa_icon: "fas fa-compass", path: "/sunnahs" },
        { name: "Performance", icon: "bar_chart", fa_icon: "fas fa-chart-simple", path: "/stats" },
        { name: "Settings", icon: "settings", fa_icon: "fas fa-cog", path: "/settings" },
      ],
      isMobile: false,
      isIosStandalone: false,
    };
  },
  computed: {
    iosPaddingClass() {
      return this.isIosStandalone ? 'pb-6' : '';
    },
  },
  methods: {
    checkMobile() {
      this.isMobile = window.innerWidth < 768;
      this.isIosStandalone =
        /iphone|ipad|ipod/i.test(navigator.userAgent) &&
        window.navigator.standalone;
    },
    isLinkActive(linkPath) {
      // Check if the current path matches the link or is a child route of it
      if (linkPath === '/' && (this.$route.name === 'add-habit' || this.$route.name === 'detail-habit' || this.$route.name === 'edit-habit')) {
        return true;
      }

      if (linkPath === '/settings' && (this.$route.name === 'account' || this.$route.name === 'about' || this.$route.name === 'news')) {
        return true;
      }

      const currentPath = this.$route.path;
      return (
        currentPath === linkPath || currentPath.startsWith(linkPath + "/")
      );
    },
  },
  mounted() {
    this.checkMobile();
    window.addEventListener("resize", this.checkMobile);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.checkMobile);
  },
};
</script>
