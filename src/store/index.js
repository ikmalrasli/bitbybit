import { createStore } from 'vuex';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

export default createStore({
  state: {
    selectedDay: '', // Existing state for selected day
    user: null, // Add state for user authentication
    isAuthenticated: false, // Add state to track authentication status
  },
  mutations: {
    setSelectedDay(state, day) {
      state.selectedDay = day;
    },
    SET_USER(state, user) {
      state.user = user;
      state.isAuthenticated = !!user; // Set isAuthenticated based on whether the user exists
    },
    CLEAR_USER(state) {
      state.user = null;
      state.isAuthenticated = false;
    }
  },
  actions: {
    updateSelectedDay({ commit }, day) {
      commit('setSelectedDay', day);
    },
    async login({ commit }, { email, password }) {
      const auth = getAuth();
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        commit('SET_USER', userCredential.user);
      } catch (error) {
        throw error;
      }
    },
    async logout({ commit }) {
      const auth = getAuth();
      try {
        await signOut(auth);
        commit('CLEAR_USER');
      } catch (error) {
        throw error;
      }
    },
    fetchUser({ commit }) {
      const auth = getAuth();
      onAuthStateChanged(auth, (user) => {
        if (user) {
          commit('SET_USER', user);
        } else {
          commit('CLEAR_USER');
        }
      });
    }
  },
  getters: {
    getSelectedDay: (state) => state.selectedDay,
    isAuthenticated: (state) => state.isAuthenticated,
    user: (state) => state.user,
  }
});
