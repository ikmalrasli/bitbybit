<template>
    <div class="p-4 w-full min-h-screen flex items-center justify-center">
      <div class="bg-white p-8 border rounded-lg shadow-lg w-full max-w-md">
        <h2 class="text-2xl font-bold mb-6 text-gray-700 text-center">Forgot Password</h2>
        <form @submit.prevent="handleForgotPassword">
          <div class="mb-6">
            <label class="block text-gray-600 mb-2">Enter your email</label>
            <input
              type="email"
              v-model="email"
              class="w-full p-3 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <button
            type="submit"
            class="w-full bg-violet-500 text-white py-3 rounded-lg hover:bg-violet-600 transition duration-300"
          >
            Send Reset Link
          </button>
        </form>
        <p class="text-gray-500 mt-4 text-center">
          Remembered your password?
          <router-link to="/login" class="text-blue-500 hover:underline">Login</router-link>
        </p>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        email: ''
      };
    },
    methods: {
      handleForgotPassword() {
        // Handle forgot password logic here
        console.log('Forgot password for:', this.email);
      }
    }
  };
  </script>
  
  <style scoped>
  </style>
  