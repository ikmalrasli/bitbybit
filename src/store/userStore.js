import { defineStore } from 'pinia';
import { useUIStore } from './uiStore';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import * as Sentry from "@sentry/vue";

// Manual persistence for pushNotiGranted
const PERSISTED_KEYS = ['pushNotiGranted'];
const STORAGE_KEY = 'userStore';

const getPersistedState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return PERSISTED_KEYS.reduce((acc, key) => {
        if (key in parsed) {
          acc[key] = parsed[key];
        }
        return acc;
      }, {});
    }
  } catch (error) {
    console.warn('Error loading persisted state:', error);
  }
  return {};
};

const persistState = (state) => {
  try {
    const toPersist = PERSISTED_KEYS.reduce((acc, key) => {
      if (key in state) {
        acc[key] = state[key];
      }
      return acc;
    }, {});
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
  } catch (error) {
    console.warn('Error persisting state:', error);
  }
};

export const useUserStore = defineStore('userStore', {
  state: () => ({
    user: null,
    pushNotiGranted: false,
    ...getPersistedState(),
  }),
  getters: {
    // This makes checking auth status in components very easy
    isAuthenticated: (state) => !!state.user,
    getUserId: (state) => state.user ? state.user.uid : null,
  },
  actions: {
    async login(email, password) {
      const loading = useUIStore(); // Call loadingStore
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
      const loading = useUIStore();
      loading.setLoading(true);

      return new Promise((resolve) => {
        const auth = getAuth();
        onAuthStateChanged(auth, (user) => {
          if (user) {
            this.user = user;
            loading.setLoading(false);
          } else {
            this.user = null;
            loading.setLoading(false);
          }
          resolve(user);
        });
      });
    },

    setPushNotiGranted(granted) {
      this.pushNotiGranted = granted;
      persistState(this.$state);
    },
  },
});