<template>
  <div class="px-4 min-h-screen flex items-center justify-center w-full">
    <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <h2 class="text-2xl font-bold mb-6 text-gray-700 text-center">Register</h2>
      <form @submit.prevent="handleRegister">
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
          Register
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

export default {
  data() {
    return {
      email: "",
      password: ""
    };
  },
  methods: {
    ...mapActions(['login']), // Optionally reuse login action
    async handleRegister() {
      const auth = getAuth();
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, this.email, this.password);
        this.$store.commit('SET_USER', userCredential.user); // Commit user to Vuex store
        this.$router.push("/home"); // Redirect after successful registration
      } catch (error) {
        console.error("Registration error:", error);
        alert(error.message); // Display error message to the user
      }
    }
  }
};
</script>

<style scoped>
</style>
