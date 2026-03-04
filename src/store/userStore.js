import { defineStore } from 'pinia';
import { useLoadingStore } from './loadingStore';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import * as Sentry from "@sentry/vue";

export const useUserStore = defineStore('userStore', {
  state: () => ({
    user: null,
  }),
  getters: {
    // This makes checking auth status in components very easy
    isAuthenticated: (state) => !!state.user,
  },
  actions: {
    async login(email, password) {
      const loading = useLoadingStore(); // Call loadingStore
      loading.setLoading(true);

      const auth = getAuth();
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        this.user = userCredential.user;
      } catch (error) {
        Sentry.captureException(error, { tags: { action: 'login', email } });
        throw error;
      } finally {
        loading.setLoading(false);
      }
    },

    async logout() {
      const auth = getAuth();
      try {
        await signOut(auth);
        this.user = null;
        // Logic to clear other stores (like Habits) would go here later
      } catch (error) {
        Sentry.captureException(error, { tags: { action: 'logout' } });
        throw error;
      }
    },
    
    fetchUser() {
      const loading = useLoadingStore();
      loading.setLoading(true);

      return new Promise((resolve) => {
        const auth = getAuth();
        onAuthStateChanged(auth, (user) => {
          this.user = user;
          loading.setLoading(false);
          resolve(user);
        });
      });
    },
  },
});