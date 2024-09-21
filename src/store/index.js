import { createStore } from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { db } from '../firebase'; // Import your Firestore instance
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';

export default createStore({
  /*plugins: [
    createPersistedState({
      paths: ['selectedDay','selectedHabit']  // Only persist specific state properties
    })
  ],*/
  state: {
    selectedDay: null,
    user: null,
    isAuthenticated: false,
    habits: [],
    weekHabits: [],
    dayHabits: [],
    selectedHabit: [],
    loading: true
  },
  mutations: {
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
    SET_WEEK_HABITS(state, weekHabits) {
      state.weekHabits = weekHabits;
    },
    SET_DAY_HABITS(state, dayHabits) {
      state.dayHabits = dayHabits;
    },
    setSelectedHabit(state, habit) {
      state.selectedHabit = habit
    }
  },
  actions: {
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
            //commit('setLoading', false);
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
              this.dispatch('fetchWeekProgress')
            });
          }, (error) => {
            console.error('Error fetching real-time habits:', error);
          });          
        }
      } catch(error) {
        console.error('try failed at fetchHabits:', error);
      }
    },
    async fetchWeekProgress({ commit, state }) {
      //get progress for up until sunday
      const progressArray = [];
      const today = new Date();
      const currentDayOfWeek = today.getDay();
      const currentDate = today.getDate();

      const startOfWeek = new Date(today);
      startOfWeek.setDate(currentDate - currentDayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      
      state.habits.forEach(habit => {
        try {
          const q = query(
            collection(db, 'progress'),
            where('habitId', '==', habit.habitId),
            where('timestamp', '>=', startOfWeek),
            orderBy('timestamp', 'desc'),
          );

          // Set up real-time listener
          onSnapshot(q, (querySnapshot) => {

            querySnapshot.forEach((doc) => {
              const data = doc.data();
              progressArray.push({ ...data, progressId: doc.id });
              
              const outputArray = progressArray.reduce((acc, curr) => {
                // Convert Firestore timestamp to JavaScript Date object
                const currentDate = curr.timestamp.toDate ? curr.timestamp.toDate() : new Date(curr.timestamp);
              
                // Get the day (ignoring time) for the current entry
                const currentDay = currentDate.setHours(0, 0, 0, 0);
              
                // Find if there's already a habit with the same habitId and same day in acc
                const existingHabit = acc.find(habit => {
                  const habitDate = habit.timestamp.toDate ? habit.timestamp.toDate() : new Date(habit.timestamp);
                  const existingDay = habitDate.setHours(0, 0, 0, 0);
                  
                  return habit.habitId === curr.habitId && existingDay === currentDay;
                });
              
                // If habit on the same day is found, replace it if the progress is higher
                if (existingHabit) {
                  if (curr.progress > existingHabit.progress) {
                    acc[acc.indexOf(existingHabit)] = curr;
                  }
                } else {
                  // Otherwise, add the new entry
                  acc.push(curr);
                }
              
                return acc;
              }, []);
              
              //console.log(outputArray);   
              
              commit('SET_WEEK_HABITS', outputArray);
              this.dispatch('getDayHabits')
            });
          });          
        } catch (error) {
          console.error("Error fetching latest progress:", error);
        }
      });
    },
    async getDayHabits({ commit, state }) {
      //console.log(this.weekHabits)
      const dayHabits = []
      state.weekHabits.forEach(habit => {
        //console.log(habit.timestamp.toDate())
        //console.log('selected day:', this.getSelectedDay)
        const selectStart = new Date(state.selectedDay)
        const selectEnd = new Date(state.selectedDay)
        selectStart.setHours(0, 0, 0, 0)
        selectEnd.setHours(23, 59, 59, 999)
        if (habit.timestamp.toDate() >= selectStart) {
          if (habit.timestamp.toDate() <= selectEnd) {
            dayHabits.push(habit)
          }
        }
      })
      //console.log(dayHabits)
      commit('SET_DAY_HABITS', dayHabits)
      commit('setLoading', false)
    },
  },
  getters: {
    getSelectedDay: (state) => state.selectedDay,
    isAuthenticated: (state) => state.isAuthenticated,
    user: (state) => state.user,
    habits: (state) => state.habits,
    weekHabits: (state) => state.weekHabits,
  },
});