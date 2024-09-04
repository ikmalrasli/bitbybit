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
        <div class="mb-4">
          <label class="block text-gray-600 mb-2">Nickname</label>
          <input
            type="text"
            v-model="nickname"
            class="w-full p-3 border border-gray-300 rounded-lg"
            required
          />
        </div>
        <div class="mb-4">
          <label class="block text-gray-600 mb-2">Password</label>
          <input
            type="password"
            v-model="password"
            class="w-full p-3 border border-gray-300 rounded-lg"
            required
          />
        </div>
        <div class="mb-6">
          <label class="block text-gray-600 mb-2">Confirm Password</label>
          <input
            type="password"
            v-model="confirmPassword"
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

      <p class="text-gray-500 mt-4 text-center">
        Already have an account?
        <router-link to="/login" class="text-blue-500 hover:underline">Login</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore"; // Import Firestore

export default {
  data() {
    return {
      email: "",
      password: "",
      confirmPassword: "",
      nickname: "" // Added nickname field
    };
  },
  methods: {
    async handleRegister() {
      if (this.password !== this.confirmPassword) {
        alert("Passwords do not match!");
        return;
      }

      const auth = getAuth();
      const db = getFirestore(); // Initialize Firestore

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, this.email, this.password);
        const user = userCredential.user;

        // Save the user data to Firestore
        await setDoc(doc(db, "users", user.uid), {
          email: this.email,
          nickname: this.nickname,
          uid: user.uid
        });

        // Commit user to Vuex store
        this.$store.commit('SET_USER', user);

        // Redirect after successful registration
        this.$router.push("/home");
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
