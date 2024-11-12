import { createStore } from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { db } from '../firebase'; // Import your Firestore instance
import { collection, query, where, onSnapshot, orderBy, addDoc, doc, updateDoc } from 'firebase/firestore';
import { getTotalProgressDay } from '../utils/getTotalProgressDay';
import { data } from 'autoprefixer';

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
    dayMemos: [],
    selectedHabit: [],
    allSunnahs: [],
    loading: true,
    selectedSunnah: null,
    selectionMode: false,
    selectedHabits: [],
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
    },
    SET_DAY_MEMOS(state, memos) {
      state.dayMemos = memos;
    },
    toggleSelectionMode(state) {
      state.selectionMode = !state.selectionMode;
      if (!state.selectionMode) state.selectedHabits = []; // Clear selection when exiting selection mode
    },
    selectHabit(state, habitId) {
      if (state.selectedHabits.includes(habitId)) {
        state.selectedHabits = state.selectedHabits.filter(id => id !== habitId); // Deselect habit
      } else {
        state.selectedHabits.push(habitId); // Select habit
      }
    },
    markHabitsCompleted(state) {
      let setTimestamp = new Date();
      let onTime = true;
      if (state.selectedDay.setHours(0, 0, 0, 0) != new Date().setHours(0, 0, 0, 0)) {
        setTimestamp = new Date(state.selectedDay);
        setTimestamp.setHours(23, 59, 59, 999);
        onTime = false;
      }

      state.selectedHabits.forEach(habitId => {
        const habit = state.dayHabits.find(h => h.habitId === habitId);
        if (habit.progressId !== '') {
          const docRef = doc(db, 'progress', habit.progressId);
          updateDoc(docRef, {
            progress: habit.dailyGoal,
            timestamp: setTimestamp,
            onTime: onTime
        }).catch((error) => {
            console.error(error);
            this.$toast.error({
              message: 'Error creating progress entry. Please try again.',
              duration: 2000
            });
          });
        } else {
          const habitRef = addDoc(collection(db, "progress"), {
            habitId: habit.habitId,
            progress: habit.dailyGoal,
            timestamp: setTimestamp,
            onTime: onTime
          }).catch((error) => {
            console.error(error);
            this.$toast.error({
              message: 'Error creating progress entry. Please try again.',
              duration: 2000
            });
          })
        }
      });
      state.selectedHabits = []; // Clear selection after marking as completed
      state.selectionMode = false; // Exit selection mode
    }
  },
  actions: {
    toggleSelectionMode({ commit }) {
      commit('toggleSelectionMode');
    },
    selectHabit({ commit }, habitId) {
      commit('selectHabit', habitId);
    },
    markHabitsCompleted({ commit }) {
      commit('markHabitsCompleted');
    },
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
      this.dispatch('getDayMemos', day);
    },
    getDayMemos({ commit, state}, day) {
      // Create separate Date objects for start and end of day
      const startOfDay = new Date(day);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(day);
      endOfDay.setHours(23, 59, 59, 999);
      const userId = state.user.uid;
      
      // Query Firestore for habits belonging to the authenticated user
      const q = query(
        collection(db, 'memos'),
        where('userId', '==', userId),
        where('timestamp', '>=', startOfDay),
        where('timestamp', '<=', endOfDay),
        orderBy('memo', 'asc')
      );
      const memos = [];
    
      // Set up a real-time listener
      onSnapshot(q, (querySnapshot) => {
        memos.length = 0; // Clear array to avoid duplicates on re-renders
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          memos.push({ ...data, memoId: doc.id });
        });
        commit('SET_DAY_MEMOS', memos);
      }, (error) => {
        console.error('Error fetching real-time memos:', error);
      });
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