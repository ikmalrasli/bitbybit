<template>
  <div class="w-full h-full flex flex-col">
    <!-- Header -->
    <header class="bg-white p-4 flex items-center relative">
      <button @click="goBack" class="material-icons text-gray-600 mr-4" aria-label="Go back">chevron_left</button>
      <h1 class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl text-black font-bold text-center">
        Account
      </h1>
    </header>

    <!-- Content -->
    <div class="p-4 overflow-y-auto flex-grow">
      <div class="max-w-md mx-auto">
        <form @submit.prevent="handleUpdateAccount">
          <div class="mb-4">
            <label for="email" class="block text-gray-600 mb-2">Email</label>
            <input
              id="email"
              type="email"
              v-model="email"
              class="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
              disabled
            />
          </div>
          <div class="mb-4">
            <label for="nickname" class="block text-gray-600 mb-2">Nickname</label>
            <input
              id="nickname"
              type="text"
              v-model="nickname"
              class="w-full p-3 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <!-- Password Fields (only for email/password users) -->
          <div v-if="isEmailPasswordUser">
            <div class="mb-4">
              <label for="newPassword" class="block text-gray-600 mb-2">New Password</label>
              <input
                id="newPassword"
                type="password"
                v-model="newPassword"
                class="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
            <div class="mb-6">
              <label for="confirmNewPassword" class="block text-gray-600 mb-2">Confirm New Password</label>
              <input
                id="confirmNewPassword"
                type="password"
                v-model="confirmNewPassword"
                class="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <button
            type="submit"
            class="w-full bg-violet-400 text-white py-3 rounded-lg disabled:bg-gray-300 hover:bg-violet-600 transition duration-300"
            :disabled="true"
          >
            Update Account
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

export default {
  computed: {
    ...mapState(['user']),
    ...mapGetters(['isAuthenticated']),

    // Determines if the user signed in with email/password
    isEmailPasswordUser() {
      return this.user && this.user.providerData.some(provider => provider.providerId === 'password');
    },

    email() {
      return this.user?.email || '';
    },

    // Add more properties for other fields like `nickname`, if necessary
    // Example:
    nickname: {
      get() {
        return this.user?.displayName || '';
      },
      set(value) {
        // Implement logic to update nickname if needed

      },
    },
  },
  methods: {
    goBack() {
      this.$router.push('/settings');
    },
    
    handleUpdateAccount() {
      if (!this.isEmailPasswordUser && (this.newPassword || this.confirmNewPassword)) {
        // Show a message that password change is not available for Google users
        this.$toast.error({
          message: 'Password change is not available for Google sign-in users.',
          duration: 3000,
        });
        return;
      }
      // Implement your update logic here
    }
  },
  data() {
    return {
      newPassword: '',
      confirmNewPassword: '',
    };
  }
};
</script>
