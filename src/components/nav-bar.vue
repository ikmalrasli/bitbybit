<template>
  <div>
    <!-- Overlay for mobile mode -->
    <div 
      v-if="showSidebar" 
      class="absolute inset-0 z-30 bg-black opacity-50 md:hidden" 
      @click="toggleSidebar"
    ></div>

    <!-- Sidebar -->
    <div
      :class="[
        'absolute top-0 left-0 h-full z-40 transition-transform duration-300 bg-white',
        showSidebar ? 'translate-x-0 w-3/4' : '-translate-x-full',
        'md:translate-x-0 md:w-60'
      ]"
    >
      <div class="p-4 font-bold text-xl text-violet-400">BitByBit</div>
      <nav class="flex flex-col">
        <router-link
          v-for="link in links" 
          :key="link.name" 
          :to="link.path"
          class="flex items-center p-2 pl-8 hover:bg-violet-200"
          :class="{ 
            'text-white font-semibold bg-violet-400': isLinkActive(link.path) 
          }"
        >
          <span class="material-icons mr-2">{{ link.icon }}</span> 
          <span>{{ link.name }}</span>
        </router-link>
        <button
          @click="logout"
          class="flex items-center p-2 pl-8 hover:bg-violet-200"
        >
          <span class="material-icons mr-2">logout</span> 
          <span>Logout</span>
        </button>
      </nav>
    </div>
  </div>
</template>

<script>
import { getAuth, signOut } from "firebase/auth";

export default {
  data() {
    return {
      showSidebar: false, // Controls the sidebar visibility on mobile
      links: [
        { name: "Home", icon: "home", path: "/" },
        { name: "Calendar", icon: "calendar_today", path: "/calendar" },
        { name: "Sunnahs", icon: "explore", path: "/sunnahs" },
        { name: "Stats", icon: "bar_chart", path: "/stats" },
        { name: "Test", icon: "science", path: "/test" }
      ],
    };
  },
  props: {
    showSidebar: Boolean,
  },
  methods: {
    toggleSidebar() {
      this.$emit("toggle-sidebar");
    },
    isLinkActive(linkPath) {
      // Check if the current path matches the link or is a child route of it
      if (linkPath === '/' && this.$route.name === 'add-habit') {
        return true
      } else if (linkPath === '/' && this.$route.name === 'detail-habit') {
        return true
      }

      const currentPath = this.$route.path;
      return currentPath === linkPath || currentPath.startsWith(linkPath + "/");

    },
    ...mapActions(['logout']), // Map Vuex action
    async logout() {
      try {
        await this.logout(); // Dispatch the logout action
        this.$router.push("/login"); // Redirect after logout
      } catch (error) {
        console.error("Logout error:", error);
        alert(error.message); // Display error message to the user
      }
    }
  },
};
</script>
