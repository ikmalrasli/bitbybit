<template>
  <div class="px-4 min-h-screen flex items-center justify-center w-full">
    <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <h2 class="text-2xl font-bold mb-6 text-gray-700 text-center">Login</h2>
      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label class="block text-gray-600 mb-2">Email</label>
          <input
            type="email"
            v-model="email"
            class="w-full p-3 border border-gray-300 rounded-lg"
            required
          />
        </div>
        <div class="mb-6">
          <label class="block text-gray-600 mb-2">Password</label>
          <input
            type="password"
            v-model="password"
            class="w-full p-3 border border-gray-300 rounded-lg"
            required
          />
        </div>
        <button
          type="submit"
          class="w-full bg-violet-500 text-white py-3 rounded-lg hover:bg-violet-600 transition duration-300"
        >
          Login
        </button>
      </form>

      <!-- Google Login Button -->
      <button
        @click="signInWithGoogle"
        class="mt-6 w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition duration-300 flex items-center justify-center"
      >
        <img src="../../assets/Google_logo.svg" class="w-6 h-6 mr-2">
        Sign in with Google
      </button>

      <p class="text-gray-500 mt-4 text-center">
        Don't have an account?
        <router-link to="/register" class="text-blue-500 hover:underline">Register</router-link>
      </p>
      <p class="text-gray-500 mt-2 text-center">
        <router-link to="/forgot-password" class="text-blue-500 hover:underline">Forgot Password?</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import { auth, provider, signInWithPopup } from "../../firebase";

export default {
  data() {
    return {
      email: "",
      password: ""
    };
  },
  methods: {
    ...mapActions(['login']), // Map Vuex actions
    async handleLogin() {
      try {
        await this.login({ email: this.email, password: this.password });
        this.$router.push("/home"); // Redirect after successful login
      } catch (error) {
        console.error("Login error:", error);
        alert(error.message); // Display error message to the user
      }
    },
    signInWithGoogle() {
      signInWithPopup(auth, provider)
        .then((result) => {
          const user = result.user;
          this.$store.commit('SET_USER', user); // Commit user to Vuex store
          this.$router.push("/home"); // Redirect after successful login
        })
        .catch((error) => {
          console.error("Google login error:", error);
          alert(error.message); // Display error message to the user
        });
    }
  }
};
</script>

<style scoped>
</style>
