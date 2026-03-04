<template>
  <div class="px-4 min-h-screen flex items-center justify-center w-full">
    <div class="bg-white p-8 rounded-lg border shadow-lg w-full max-w-md">
      <h1 class="text-center font-bold text-3xl text-violet-400 pb-2">BitByBit</h1>
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

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../store/authStore';
import store from '../../store'; // Direct import of Vuex store
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getNotifications } from '../../utils/pushNotifications';
import * as Sentry from "@sentry/vue";

const router = useRouter();
const authStore = useAuthStore();

const email = ref("");
const password = ref("");

// Define ignored errors
const IGNORED_AUTH_ERRORS = [
  'auth/invalid-credential',
  'auth/invalid-email',
  'auth/user-not-found',
  'auth/wrong-password',
  'auth/invalid-login-credentials',
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/operation-not-allowed',
  'auth/email-already-in-use',
  'auth/weak-password'
];

// Helper function to check if error should be reported
const shouldReportError = (error) => {
  if (!error?.code) return true;
  return !IGNORED_AUTH_ERRORS.includes(error.code);
};

// Helper function to get user-friendly error message
const getAuthErrorMessage = (error) => {
  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign in was cancelled';
    case 'auth/operation-not-allowed':
      return 'This sign in method is not allowed';
    case 'auth/email-already-in-use':
      return 'This email is already registered';
    case 'auth/weak-password':
      return 'Password is too weak';
    default:
      return error.message;
  }
};

const handleLogin = async () => {
  try {
    const user = await authStore.login({ email: email.value, password: password.value });

    // Note: We'll need to update these store calls when we migrate other modules
    // For now, we keep the existing Vuex calls for non-auth functionality
    store.dispatch('updateLoading', true);
    store.commit('SET_USER', user)
    store.dispatch('fetchUser').then((user) => {
      if (user) {
        getNotifications(store, router.app.config.globalProperties.$toast);
        store.dispatch('fetchHabits');
      } else {
        store.dispatch('updateLoading', false);
      }
    });

    router.push("/");

  } catch (error) {
    store.dispatch('updateLoading', false);
    
    // Only report non-ignored errors to Sentry
    if (shouldReportError(error)) {
      Sentry.captureException(error, {
        tags: {
          action: 'handleLogin',
          email: email.value
        }
      });
      console.error("Login error:", error);
    }

    // Show user-friendly error message
    router.app.config.globalProperties.$toast.error(getAuthErrorMessage(error));
  }
};

const signInWithGoogle = async () => {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  const db = getFirestore();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const displayName = user.displayName;
    const userEmail = user.email;
    const uid = user.uid;

    await setDoc(doc(db, "users", uid), {
      email: userEmail,
      nickname: displayName,
      uid: uid
    });
    
    // Set user in authStore
    authStore.setUser(user);
    
    // Note: We'll need to update these store calls when we migrate other modules
    store.dispatch('updateLoading', true);
    store.commit('SET_USER', user)
    store.dispatch('fetchUser').then((user) => {
      if (user) {
        getNotifications(store, router.app.config.globalProperties.$toast);
        store.dispatch('fetchHabits');
      } else {
        store.dispatch('updateLoading', false);
      }
    });

    router.push("/")
    
  } catch (error) {
    store.dispatch('updateLoading', false);
    
    // Only report non-ignored errors to Sentry
    if (shouldReportError(error)) {
      Sentry.captureException(error, {
        tags: {
          action: 'signInWithGoogle'
        }
      });
      console.error("Google login error:", error);
    }

    // Show user-friendly error message
    router.app.config.globalProperties.$toast.error(getAuthErrorMessage(error));
  }
};
</script>


<style scoped>
</style>
