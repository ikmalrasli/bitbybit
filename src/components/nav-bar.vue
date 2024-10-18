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
        'md:translate-x-0 md:w-56'
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
            'text-white font-semibold bg-violet-400 hover:bg-violet-500': isLinkActive(link.path) 
          }"
        >
          <span class="material-icons mr-2">{{ link.icon }}</span> 
          <span>{{ link.name }}</span>
        </router-link>
        <button
          @click="handleLogout"
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
import { mapActions } from "vuex";
import { getAuth } from "firebase/auth";

export default {
  props: {
    showSidebar: Boolean,
  },
  data() {
    return {
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
      if (linkPath === '/' && (this.$route.name === 'add-habit' || this.$route.name === 'detail-habit')) {
        return true;
      }
      const currentPath = this.$route.path;
      return currentPath === linkPath || currentPath.startsWith(linkPath + "/");
    },
    ...mapActions(['logout']), // Map Vuex action
    async handleLogout() {
      try {
        const auth = getAuth();
        await auth.signOut(); // Firebase sign out
        await this.logout(); // Dispatch the Vuex logout action
        this.$router.push("/login"); // Redirect after logout
      } catch (error) {
        console.error("Logout error:", error);
        alert(error.message); // Display error message to the user
      }
    }
  },
};
</script>
