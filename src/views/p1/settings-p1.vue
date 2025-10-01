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
      
      <div v-if="!$store.state.pushNotiGranted"
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
import { mapActions } from "vuex";
import { getAuth } from "firebase/auth";
import { useDialogStore } from '../../store/dialogStore';
import { useStatStore } from "../../store/statStore";
import { getNotifications, removeTokenFromFirestore } from "../../utils/pushNotifications";

export default {
  data() {
    return {
      links: [
        { name: "Account", icon: "person", path: "/account" },
        { name: "News & Updates", icon: "feed", path: "/news", hasNewNews: this.$store.state.hasNewNews },
        { name: "About Us", icon: "info", path: "/about" },
      ],
      dialogStore: useDialogStore(),
      statStore: useStatStore(),
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
    ...mapActions(['logout']),
    userLogout() {
      this.dialogStore.openDialog(
        'Logout',
        'Are you sure you want to logout?',
        'default',
        () => {
          this.handleLogout();
          this.statStore.setProgressUpdated();
          this.statStore.resetHabitsCache();
          this.$store.dispatch('updateLoadingHome', true);
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
        await this.logout(); // Additional logout handling
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
      getNotifications(this.$store, this.$toast);
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
