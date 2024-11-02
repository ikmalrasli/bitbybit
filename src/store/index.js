import { createStore } from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { db } from '../firebase'; // Import your Firestore instance
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { getTotalProgressDay } from '../utils/getTotalProgressDay';

const loadTimeout = 1000;

export default createStore({
  plugins: [
    createPersistedState({
    paths: ['user', 'isAuthenticated']  // Include user and isAuthenticated
  })
  ],
  state: {
    selectedDay: new Date(),
    user: null,
    isAuthenticated: false,
    habits: [],
    weekProgress: [],
    weekHabits: [],
    dayHabits: [],
    selectedHabit: [],
    allSunnahs: [],
    loading: true,
    selectedSunnah: null
  },
  mutations: {
    setSelectedSunnah(state, sunnah) {
      state.selectedSunnah = sunnah;
    },
    setLoading(state, loading) {
      state.loading = loading;
    },
    setSelectedDay(state, day) {
      state.selectedDay = day;
    },
    SET_USER(state, user) {
      state.user = user;
      state.isAuthenticated = !!user;
    },
    CLEAR_USER(state) {
      state.user = null;
      state.isAuthenticated = false;
    },
    SET_HABITS(state, habits) {
      state.habits = habits;
    },  
    SET_WEEK_PROGRESS(state, weekProgress) {
      state.weekProgress = weekProgress;
    },
    SET_WEEK_HABITS(state, weekHabits) {
      state.weekHabits = weekHabits;
    },
    SET_DAY_HABITS(state, dayHabits) {
      state.dayHabits = dayHabits;
    },
    setSelectedHabit(state, habit) {
      state.selectedHabit = habit
    },
    SET_SUNNAHS(state, sunnahs) {
      state.allSunnahs = sunnahs;
    }
  },
  actions: {
    updateLoading({ commit }, loading) {
      commit('setLoading', loading);
    },
    updateSelectedDay({ commit }, day) {
      commit('setSelectedDay', day);
    },
    updateSelectedHabit({ commit }, habit) {
      commit('setSelectedHabit', habit);
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
      return new Promise((resolve) => {
        const auth = getAuth();
        onAuthStateChanged(auth, (user) => {
          if (user) {
            commit('SET_USER', user);
          } else {
            commit('CLEAR_USER');
            commit('setLoading', false);
            console.log('fetchUser set loading to false');
          }
          resolve(user);
        });
      });
    },
    async fetchHabits({ commit, state }) {
      try {
        if (state.user) { // Ensure the user is authenticated
          const userId = state.user.uid; // Get the authenticated user's ID
          
          // Query Firestore for habits belonging to the authenticated user
          const q = query(
            collection(db, 'habits'),
            where('userId', '==', userId), // Filter habits by userId
          );
          
          // Set up a real-time listener
          onSnapshot(q, (querySnapshot) => {
            const habits = [];
            querySnapshot.forEach((doc) => {
              habits.push({ habitId: doc.id, ...doc.data() });
              commit('SET_HABITS', habits);
            });

            this.dispatch('fetchWeekProgress')

            if (querySnapshot.empty) {
              console.log('No habits found');
              setTimeout(() => {
                commit('setLoading', false);
              }, loadTimeout);
              console.log('fetchHabits set loading to false');
            }
          }, (error) => {
            console.error('Error fetching real-time habits:', error);
          });          
        }
      } catch(error) {
        console.error('try failed at fetchHabits:', error);
      }
    },
    async fetchWeekProgress({ commit, state }) {
      // get progress for up until last sunday sunday
      const progressArray = [];
      const today = new Date();
      const currentDayOfWeek = today.getDay();
      const currentDate = today.getDate();
    
      const startOfWeek = new Date(today);
      startOfWeek.setDate(currentDate - currentDayOfWeek - 7);
      startOfWeek.setHours(0, 0, 0, 0);
    
      for (const index in state.habits) {
        const habit = state.habits[index]; // Access habit by index
        try {
          const q = query(
            collection(db, 'progress'),
            where('habitId', '==', habit.habitId),
            where('timestamp', '>=', startOfWeek),
            orderBy('timestamp', 'desc')
          );
          
          // Set up real-time listener
          onSnapshot(q, (querySnapshot) => {
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              progressArray.push({ ...data, progressId: doc.id });
              
              const outputArray = progressArray.reduce((acc, curr) => {
                const currentDate = curr.timestamp.toDate ? curr.timestamp.toDate() : new Date(curr.timestamp);
                const currentDay = currentDate.setHours(0, 0, 0, 0);
                
                const existingHabit = acc.find(habit => {
                  const habitDate = habit.timestamp.toDate ? habit.timestamp.toDate() : new Date(habit.timestamp);
                  const existingDay = habitDate.setHours(0, 0, 0, 0);
                  
                  return habit.habitId === curr.habitId && existingDay === currentDay;
                });
                
                if (existingHabit) {
                  if (curr.timestamp >= existingHabit.timestamp) {
                    acc[acc.indexOf(existingHabit)] = curr;
                  }
                } else {
                  acc.push(curr);
                }
                
                return acc;
              }, []);
            
              commit('SET_WEEK_PROGRESS', outputArray);
            });

            this.dispatch('getDayHabits', this.state.selectedDay);

            if (querySnapshot.empty) {
              setTimeout(() => {
                commit('setLoading', false);
              }, loadTimeout);
            }
          });
        } catch (error) {
          console.error("Error fetching latest progress:", error);
        }
      }
    },
    async getDayHabits({ commit, state }, day) {
      const { endHabits } = getTotalProgressDay(day, state.weekProgress, state.habits);
      commit('SET_DAY_HABITS', endHabits);
      setTimeout(() => {
        commit('setLoading', false);
      }, loadTimeout);
      this.dispatch('fetchSunnahs');
    },
    fetchSunnahs({ commit }) {
      const sunnahs = [];
      // Fetch sunnahs from Firestore
      onSnapshot(query(collection(db, 'sunnahs')), (snapshot) => {
        snapshot.forEach(doc => {
          sunnahs.push({ sunnahId: doc.id, ...doc.data() });
        });
        commit('SET_SUNNAHS', sunnahs);
      });
    }
  },
  getters: {
    getSelectedDay: (state) => state.selectedDay,
    isAuthenticated: (state) => state.isAuthenticated,
    user: (state) => state.user,
    getHabits: (state) => state.habits,
    weekHabits: (state) => state.weekHabits,
    allSunnahs: state => state.allSunnahs,
    selectedSunnah: state => state.selectedSunnah
  },
});