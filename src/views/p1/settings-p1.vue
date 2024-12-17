<template>
<div class="w-full h-full flex flex-col flex-grow flex p-4 space-y-8">
  <div class="space-y-1">
    <router-link
      v-for="link in links" 
      :key="link.name" 
      :to="link.path"
      class="flex items-center p-4 text-gray-700 border rounded-lg shadow-sm hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
    >
      <span class="mr-4 material-icons">{{ link.icon }}</span> 
      <span>{{ link.name }}</span>
    </router-link>
  </div>

  <div class="space-y-1">
    <div class="flex items-center p-4 text-gray-700 border rounded-lg shadow-sm hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
    @click="shareApp">
      <span class="mr-4 material-icons">share</span> 
      <span>Share to friends</span>
    </div>
    <div class="flex items-center p-4 text-gray-700 border rounded-lg shadow-sm hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
    @click="sendEmail">
      <span class="mr-4 material-icons">mail</span> 
      <span>Send feedback/suggestions</span>
    </div>
  </div>
  <button
      @click="userLogout"
      class="w-full p-4 flex border bg-red-400 border-red-400 rounded-full text-white hover:text-red-500 hover:bg-gray-50"
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

export default {
  data() {
    return {
      links: [
        { name: "Account", icon: "person", path: "/account" },
        { name: "News & Updates", icon: "feed", path: "/news" },
        { name: "About Us", icon: "info", path: "/about" },
      ],
      dialogStore: useDialogStore(),
      statStore: useStatStore(),
    };
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
        'text-red-500')
    },  
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
  }
}
</script>
