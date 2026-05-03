<template>
  <div class="w-full flex flex-col flex-grow px-4 space-y-8">
    <div class="text-gray-700 border rounded-lg shadow-sm">
      <router-link
        v-for="(link, index) in links" 
        :key="index" 
        :to="link.path"
        class="relative flex items-center justify-between px-6 py-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
        :class="[index === 0 ? 'rounded-t-lg' : '', index === links.length - 1 ? 'rounded-b-lg' : '']"
      >
        <div class="flex items-center space-x-4">
          <span class="material-icons relative">
            {{ link.icon }}
            <!-- Add notification dot for News & Updates -->
            <div v-if="link.hasNewNews" 
              class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full">
            </div>
          </span>
          <span>{{ link.name }}</span>
        </div>
        <i class="fa-solid fa-chevron-right"></i>
        <!-- Divider Line -->
        <div
          v-if="index < links.length - 1"
          class="absolute bottom-0 left-14 right-0 h-px bg-gray-200"
        ></div>
      </router-link>
    </div>

    
    <div class="text-gray-700 border rounded-lg shadow-sm rounded-lg">
      <!-- Sync Status -->
      <div class="relative flex items-center justify-between px-6 py-4 hover:bg-gray-50">
        <div class="flex items-center space-x-4">
          <span class="material-icons" :class="syncStore.isHealthy ? 'text-green-500' : 'text-red-500'">
            {{ syncStore.isSyncing ? 'sync' : (syncStore.isHealthy ? 'cloud_done' : 'cloud_off') }}
          </span>
          <div class="flex flex-col">
            <span>Sync Status</span>
            <span class="text-xs text-gray-500">{{ syncStore.isSyncing ? 'Syncing...' : syncStore.lastSyncFormatted }}</span>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <span v-if="syncStore.isSyncing" class="material-icons animate-spin text-blue-500">sync</span>
          <span v-else-if="syncStore.lastError" class="text-xs text-red-500">Error</span>
          <span v-else class="w-2 h-2 rounded-full" :class="syncStore.isHealthy ? 'bg-green-500' : 'bg-gray-300'"></span>
        </div>
        <!-- Divider Line -->
        <div class="absolute bottom-0 left-12 right-0 h-px bg-gray-200"></div>
      </div>

      <div v-if="showUpdateButton"
      class="relative flex items-center justify-between px-6 py-4 rounded-lg hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
      @click="forceUpdate">
        <div class="flex items-center space-x-4">
          <span class="material-icons">update</span> 
          <span>Force Update</span>
        </div>
        <i class="fa-solid fa-chevron-right"></i>
        <!-- Divider Line -->
        <div class="absolute bottom-0 left-12 right-0 h-px bg-gray-200"></div>
      </div>
      
      <div v-if="!userStore.pushNotiGranted"
      class="relative flex items-center justify-between px-6 py-4 rounded-lg hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
      @click="handleNotificationPermission">
        <div class="flex items-center space-x-4">
          <span class="material-icons">notifications</span> 
          <span>Enable Notifications</span>
        </div>
        <i class="fa-solid fa-chevron-right"></i>
        <!-- Divider Line -->
        <div class="absolute bottom-0 left-12 right-0 h-px bg-gray-200"></div>
      </div>

      <div class="relative flex items-center justify-between px-6 py-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
      @click="shareApp">
        <div class="flex items-center space-x-4">
          <span class="material-icons">share</span> 
          <span>Share to friends</span>
        </div>
        <i class="fa-solid fa-chevron-right"></i>
        <!-- Divider Line -->
        <div class="absolute bottom-0 left-12 right-0 h-px bg-gray-200"></div>
      </div>

      <div class="relative flex items-center justify-between px-6 py-4 rounded-lg hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
      @click="sendEmail">
        <div class="flex items-center space-x-4">
          <span class="material-icons">mail</span> 
          <span>Send feedback/suggestions</span>
        </div>
        <i class="fa-solid fa-chevron-right"></i>
        <!-- Divider Line -->
        <div class="absolute bottom-0 left-12 right-0 h-px bg-gray-200"></div>
      </div>
    </div>

    <button
      @click="userLogout"
      class="w-full p-4 flex border bg-red-400 border-red-400 rounded-full text-white hover:bg-red-500"
    >
      <span class="text-center w-full font-semibold">Logout</span>
    </button>

  
  </div>
</template>

<script>
import { getAuth } from "firebase/auth";
import { useDialogStore } from '../../store/dialogStore';
import { useStatStore } from "../../store/statStore";
import { useUserStore } from '../../store/userStore';
import { useUIStore } from '../../store/uiStore';
import { useSyncStore } from '../../store/syncStore';
import { getNotifications, removeTokenFromFirestore } from "../../utils/pushNotifications";

export default {
  data() {
    const dialogStore = useDialogStore();
    const statStore = useStatStore();
    const userStore = useUserStore();
    const uiStore = useUIStore();
    const syncStore = useSyncStore();
    return {
      links: [
        { name: "Account", icon: "person", path: "/account" },
        { name: "News & Updates", icon: "feed", path: "/news", hasNewNews: uiStore.hasNewNews },
        { name: "About Us", icon: "info", path: "/about" },
      ],
      dialogStore,
      statStore,
      userStore,
      uiStore,
      syncStore,
      showUpdateButton: true,
    };
  },
  created() {
    // Listen for service worker update event
    window.addEventListener('swUpdated', this.handleSWUpdated);

    // Check if service worker update button should be displayed
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg && reg.waiting) {
          this.showUpdateButton = true;
        }
      });
    }
  },
  beforeDestroy() {
    window.removeEventListener('swUpdated', this.handleSWUpdated);
  },
  methods: {
    userLogout() {
      this.dialogStore.openDialog(
        'Logout',
        'Are you sure you want to logout?',
        'default',
        () => {
          this.handleLogout();
          this.statStore.setProgressUpdated();
          this.statStore.resetHabitsCache();
          this.uiStore.setLoading(true);
        },
        'Confirm',
        'text-red-500'
      )
    },  
    async handleLogout() {
      try {
        const auth = getAuth();
        if (auth.currentUser) {
          await removeTokenFromFirestore(auth.currentUser.uid); // Ensure this completes first
        }
        await auth.signOut(); // Sign out only after token is removed
        await this.userStore.logout(); // Dispatch the Pinia logout action
        this.$router.push("/login");
      } catch (error) {
        console.error("Logout error:", error);
        alert(error.message); // Display error message to the user
      }
    },
    sendEmail() {
      const subject = encodeURIComponent("BitByBit User Feedback");
      const body = encodeURIComponent("Hi, here is my feedback/suggestion:");
      window.location.href = `mailto:ikmalrasli@gmail.com?subject=${subject}&body=${body}`;
    },
    async shareApp() {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'BitByBit App',
            text: 'Check out BitByBit!',
            url: 'https://bitbybit-5afe4.web.app/',
          });
          console.log('Content shared successfully');
        } catch (error) {
          console.error('Error sharing content:', error);
        }
      } else {
        alert('Sharing is not supported on this browser.');
      }
    },
    handleNotificationPermission() {
      getNotifications(this.userStore, this.$toast);
    },
    forceUpdate() {
      window.location.reload();  // Reload the page to get the new version
    },
    handleSWUpdated() {
      this.showUpdateButton = true;
    }
  },
}
</script>
