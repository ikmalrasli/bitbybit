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
        <span class="material-icons-round">{{ link.icon }}</span>
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
