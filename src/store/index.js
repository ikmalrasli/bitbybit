import { createStore } from 'vuex';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { db } from '../firebase'; // Import your Firestore instance
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';

export default createStore({
  state: {
    selectedDay: null,
    user: null,
    isAuthenticated: false,
    habits: [],
    weekHabits: [],
  },
  mutations: {
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
      return new Promise((resolve) => {
        const auth = getAuth();
        onAuthStateChanged(auth, (user) => {
          if (user) {
            commit('SET_USER', user);
          } else {
            commit('CLEAR_USER');
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

          const habits = [];
          // Set up a real-time listener
          onSnapshot(q, (querySnapshot) => {
            querySnapshot.forEach((doc) => {
              habits.push({ id: doc.id, ...doc.data() });
              commit('SET_HABITS', habits);
              this.dispatch('fetchProgress')
            });
          }, (error) => {
            console.error('Error fetching real-time habits:', error);
          });          
        }
      } catch(error) {
        console.error('try failed at fetchHabits:', error);
      }
    },
    async fetchProgress({ commit, state }) {
      //get progress for up until sunday
      const progressArray = [];
      const today = new Date();
      const currentDayOfWeek = today.getDay();
      const currentDate = today.getDate();

      const startOfWeek = new Date(today);
      startOfWeek.setDate(currentDate - currentDayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      
      state.habits.forEach(habit => {
        console.log(habit.id)
        try {
          const q = query(
            collection(db, 'progress'),
            where('habitId', '==', habit.id),
            where('timestamp', '>=', startOfWeek),
            orderBy('timestamp', 'desc'),
          );

          // Set up real-time listener
          onSnapshot(q, (querySnapshot) => {

            querySnapshot.forEach((doc) => {
              const data = doc.data();
              progressArray.push({ ...data, id: doc.id });
              
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
              
              console.log(outputArray);
                           
              
              commit('SET_WEEK_HABITS', outputArray);
            });
          });          
        } catch (error) {
          console.error("Error fetching latest progress:", error);
        }
      });

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