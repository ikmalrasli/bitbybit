<template>
  <div class="w-56 h-full bg-white hidden md:block">
    <div class="p-4 font-bold text-xl text-violet-400">BitByBit</div>
    <nav class="flex flex-col">
      <router-link
        v-for="link in links" 
        :key="link.name" 
        :to="link.path"
        class="flex items-center p-2 pl-8"
        :class="
          isLinkActive(link.path) ? 'text-white font-semibold bg-violet-400 hover:bg-violet-500': 'hover:bg-gray-100'
        "
      >
        <!--<span class="mr-2 material-icons-round">{{ link.icon }}</span>-->
        <i class="text-xl w-6 mr-2" :class="link.fa_icon"></i>
        <span>{{ link.name }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script>
import { mapActions } from "vuex";
import { getAuth } from "firebase/auth";
import { useDialogStore } from '../store/dialogStore';

export default {
  props: {
    showSidebar: Boolean,
  },
  data() {
    return {
      links: [
      { name: "Home", icon: "home", fa_icon: "fas fa-house", path: "/" },
        { name: "Calendar", icon: "calendar_today", fa_icon: "fas fa-calendar", path: "/calendar" },
        { name: "Sunnahs", icon: "explore", fa_icon: "fas fa-compass", path: "/sunnahs" },
        { name: "Performance", icon: "bar_chart", fa_icon: "fas fa-chart-simple", path: "/stats" },
        { name: "Settings", icon: "settings", fa_icon: "fas fa-cog", path: "/settings" },
      ],
      isDropdownOpen: false,
      isTablet: false,
      dialogStore: useDialogStore(),
    };
  },
  props: {
    showSidebar: Boolean,
  },
  methods: {
    checkMobile() {
      this.isTablet = window.innerWidth < 896;
    },
    showAdd() {
      return !this.isTablet && (this.$route.name === 'home' || this.$route.name === 'detail-habit')
    },
    toggleDropdown(event) {
      event.stopPropagation(); // Prevent the outside click listener from being triggered
      this.isDropdownOpen = !this.isDropdownOpen;

      // If the dropdown is open, add the click listener to detect clicks outside
      if (this.isDropdownOpen) {
        document.addEventListener('click', this.handleClickOutside);
      } else {
        document.removeEventListener('click', this.handleClickOutside);
      }
    },
    handleClickOutside(event) {
      const dropdown = this.$el.querySelector('.absolute');
      if (dropdown && !dropdown.contains(event.target)) {
        this.isDropdownOpen = false;  // Close dropdown
        document.removeEventListener('click', this.handleClickOutside); // Remove the event listener
      }
    },
    toggleSidebar() {
      this.$emit("toggle-sidebar");
    },
    isLinkActive(linkPath) {
      // Check if the current path matches the link or is a child route of it
      if (linkPath === '/' && (this.$route.name === 'add-habit' || this.$route.name === 'detail-habit')) {
        return true;
      }

      if (linkPath === '/settings' && (this.$route.name === 'account' || this.$route.name === 'about' || this.$route.name === 'news')) {
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
    },
    addHabit() {
      this.$store.commit('setSelectedSunnah', null);
      this.$router.push('/add-habit');
      this.isDropdownOpen = false;
      document.removeEventListener('click', this.handleClickOutside);
    },
    addMemo() {
      this.dialogStore.openAddMemoDialog();
      this.isDropdownOpen = false;
      document.removeEventListener('click', this.handleClickOutside);
    },
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
