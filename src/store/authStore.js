import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { migrateUserFromFirebase } from '../utils/migrateFromFirebase';
import * as Sentry from "@sentry/vue";

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null);
  const isAuthenticated = computed(() => !!user.value);
  const loading = ref(true);

  // Actions
  const setUser = (userData) => {
    user.value = userData;
  };

  const clearUser = () => {
    user.value = null;
  };

  const setLoading = (isLoading) => {
    loading.value = isLoading;
  };

  const login = async ({ email, password }) => {
    setLoading(true);
    const auth = getAuth();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      setLoading(false);
      return userCredential.user;
    } catch (error) {
      setLoading(false);
      Sentry.captureException(error, {
        tags: {
          action: 'login',
          email: email
        }
      });
      throw error;
    }
  };

  const logout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      clearUser();
    } catch (error) {
      throw error;
    }
  };

  const fetchUser = () => {
    setLoading(true);
    return new Promise((resolve) => {
      const auth = getAuth();
      onAuthStateChanged(auth, async (userData) => {
        if (userData) {
          try {
            await migrateUserFromFirebase(userData);
          } catch (err) {
            console.error('[Migration]', err);
            Sentry.captureException(err, { tags: { action: 'migrateUserFromFirebase' } });
          }
          setUser(userData);
          setLoading(false);
        } else {
          clearUser();
          setLoading(false);
        }
        resolve(userData);
      });
    });
  };

  return {
    // State
    user,
    isAuthenticated,
    loading,
    
    // Actions
    setUser,
    clearUser,
    setLoading,
    login,
    logout,
    fetchUser
  };
});
