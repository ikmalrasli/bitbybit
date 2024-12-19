import { createStore } from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { db } from '../firebase'; // Import your Firestore instance
import { collection, query, where, onSnapshot, orderBy, addDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { getTotalProgressDay } from '../utils/getTotalProgressDay';

const loadTimeout = 1000;

export default createStore({
  plugins: [
    createPersistedState({
    paths: ['user', 'isAuthenticated', 'sortType', 'habits', 'weekProgress', 'weekMemos']  // Include user and isAuthenticated
  })
  ],
  state: {
    firstFetchHabits: false,
    firstFetchWeekProgress: false,
    firstFetchWeekMemos: false,
    selectedDay: new Date(),
    user: null,
    isAuthenticated: false,
    habits: [],
    weekProgress: [],
    weekHabits: [],
    weekMemos: [],
    dayHabits: [],
    dayMemos: [],
    selectedHabit: [],
    allSunnahs: [],
    loading: true,
    loadingHome: true,
    selectedSunnah: null,
    selectionMode: false,
    selectedHabits: [],
    sortType: 'name',
  },
  mutations: {
    setFirstFetchWeekMemos(state, firstFetchMemos) {
      state.firstFetchWeekMemos = firstFetchMemos;
    },
    setFirstFetchHabits(state, firstFetchHabits) {
      state.firstFetchHabits = firstFetchHabits;
    },
    setFirstFetchWeekProgress(state, firstFetchProgress) {
      state.firstFetchProgress = firstFetchProgress;
    },
    setSelectedSunnah(state, sunnah) {
      state.selectedSunnah = sunnah;
    },
    setLoading(state, loading) {
      state.loading = loading;
    },
    setLoadingHome(state, loadingHome) {
      state.loadingHome = loadingHome;
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
      state.habits = [];
      state.weekProgress = [];
      state.weekHabits = [];
      state.dayHabits = [];
      state.dayMemos = [];
      state.selectedHabit = [];
      state.allSunnahs = [];
      state.selectedSunnah = null;
      state.selectionMode = false;
      state.selectedHabits = [];
      state.sortType = 'name';
      state.weekMemos = [];
      state.dayMemos = [];
      state.firstFetchHabits = false;
      state.firstFetchWeekProgress = false;
      state.firstFetchWeekMemos = false;
      state.selectedDay = new Date();
      state.loadingHome = true;
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
    SET_WEEK_MEMOS(state, memos) {
      state.weekMemos = memos;
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
    markHabitsCompleted(state, toast) {
      let setTimestamp = new Date();
      let onTime = true;
    
      if (state.selectedDay.setHours(0, 0, 0, 0) != new Date().setHours(0, 0, 0, 0)) {
        setTimestamp = new Date(state.selectedDay);
        setTimestamp.setHours(23, 59, 59, 999);
        onTime = false;
      }
    
      const updatePromises = state.selectedHabits.map(habitId => {
        const habit = state.dayHabits.find(h => h.habitId === habitId);
    
        if (habit.progressId !== '') {
          const docRef = doc(db, 'progress', habit.progressId);
          return updateDoc(docRef, {
            progress: habit.dailyGoal,
            timestamp: setTimestamp,
            onTime: onTime
          });
        } else {
          return addDoc(collection(db, "progress"), {
            habitId: habit.habitId,
            progress: habit.dailyGoal,
            timestamp: setTimestamp,
            onTime: onTime
          });
        }
      });
    
      // Wait for all promises to resolve
      Promise.all(updatePromises)
        .then(() => {
          toast.success({
            message: 'Habits completed!',
            duration: 1000
          });
        })
        .catch(error => {
          console.error(error);
          toast.error({
            message: 'Error. Please try again.',
            duration: 1000
          });
        });
    
      // Clear selection and exit selection mode
      state.selectedHabits = [];
      state.selectionMode = false;
    },    
    setSortType(state, type) {
      state.sortType = type
    },
    sortHabits(state) {
      if (state.sortType === 'name'){
        state.habits.sort((a, b) => a.name.localeCompare(b.name));
      } else if (state.sortType === 'color'){
        const colorOrder = {
          "red-300": 0,
          "orange-300": 1,
          "yellow-300": 2,
          "emerald-300": 3,
          "blue-300": 4,
          "pink-300": 5,
          "violet-400": 6
        };
    
        // Sort by color first, then alphabetically by name within the same color
        state.habits.sort((a, b) => {
          const colorA = colorOrder[a.color?.default || "violet-400"] ?? 99;
          const colorB = colorOrder[b.color?.default || "violet-400"] ?? 99;
    
          // First, compare color order
          if (colorA !== colorB) {
            return colorA - colorB;
          }
          
          // If colors are the same, sort alphabetically by name
          return a.name.localeCompare(b.name);
        });
      } else if (state.sortType === 'custom') {
        state.habits.sort((a, b) => (a.index ?? state.habits.length) - (b.index ?? state.habits.length));
      }
    },
  },
  actions: {
    setSortType({ commit }, type) {
      commit('setSortType', type);
    },
    sortHabits({ commit }) {
      commit('sortHabits');
    },
    toggleSelectionMode({ commit }) {
      commit('toggleSelectionMode');
    },
    setHabits({ commit }, habits) {
      commit('SET_HABITS', habits);
    },
    selectHabit({ commit }, habitId) {
      commit('selectHabit', habitId);
    },
    markHabitsCompleted({ commit, state }, toast) {
      commit('markHabitsCompleted', toast);
      if (state.firstFetchWeekProgress===false){
        this.dispatch('fetchWeekProgress');
        commit('setFirstFetchWeekProgress', true);
      }
    },
    updateLoading({ commit }, loading) {
      commit('setLoading', loading);
    },
    updateLoadingHome({ commit }, loadingHome) {
      commit('setLoadingHome', loadingHome);
    },
    updateSelectedDay({ commit }, day) {
      commit('setSelectedDay', day);
    },
    updateSelectedHabit({ commit }, habit) {
      commit('setSelectedHabit', habit);
    },
    async login({ commit }, { email, password }) {
      commit('setLoading', true);
      const auth = getAuth();
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        commit('setLoading', false);
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
      commit('setLoading', true);
      return new Promise((resolve) => {
        const auth = getAuth();
        onAuthStateChanged(auth, (user) => {
          if (user) {
            commit('SET_USER', user);
            commit('setLoading', false);
          } else {
            commit('CLEAR_USER');
            commit('setLoading', false);
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
            });
            commit('SET_HABITS', habits);
            commit('sortHabits', state.sortType);
            this.dispatch('fetchWeekProgress')
            
            console.log('fetchHabits done');

            if (querySnapshot.empty) {
              commit('setLoadingHome', false);
            }

          }, (error) => {
            console.error('Error fetching real-time habits:', error);
            if (error.code === 'resource-exhausted') {
              alert('Sorry! Database daily limit reached. Please try again later.');
            }
          });      
        }
      } catch(error) {
        console.error('try failed at fetchHabits:', error);
      }
    },
    async fetchWeekProgress({ commit, state }) {
      const progressArray = [];
      const today = new Date();
      const currentDayOfWeek = today.getDay();
      const currentDate = today.getDate();
    
      // Define start of the previous week (up to last Sunday)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(currentDate - currentDayOfWeek - 7);
      startOfWeek.setHours(0, 0, 0, 0);
    
      // Track total habits to ensure all queries are processed before committing
      let habitsProcessed = 0;
    
      for (const index in state.habits) {
        const habit = state.habits[index]; // Access each habit by index
        try {
          const q = query(
            collection(db, 'progress'),
            where('habitId', '==', habit.habitId),
            where('timestamp', '>=', startOfWeek),
            orderBy('timestamp', 'desc')
          );
    
          // Set up a real-time listener
          onSnapshot(q, (querySnapshot) => {
            // Initialize map for the latest progress entry per day for this habit
            const dailyProgressMap = {};
    
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              const progressDate = new Date(data.timestamp.toDate());
              const dayKey = progressDate.toLocaleDateString("en-CA"); // Extract the day in YYYY-MM-DD format
              // Only keep the latest document for each day (sorted by desc)
              if (!dailyProgressMap[dayKey]) {
                dailyProgressMap[dayKey] = { ...data, progressId: doc.id };
              }
            });
    
            // Push all entries for this habit into the main progress array
            progressArray.push(...Object.values(dailyProgressMap));
    
            // Check if all habit queries have completed
            habitsProcessed++;
            if (habitsProcessed === state.habits.length) {
              // Commit the aggregated result once all habit queries are processed
              //console.log(progressArray);
              commit('SET_WEEK_PROGRESS', progressArray);
              this.dispatch('getDayHabits', this.state.selectedDay);
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
      commit('setLoadingHome', false);
    },

    async fetchWeekMemos({ commit, state}) {
      const today = new Date();
      const currentDayOfWeek = today.getDay();
      const currentDate = today.getDate();
    
      const startOfWeek = new Date(today);
      startOfWeek.setDate(currentDate - currentDayOfWeek - 7);
      startOfWeek.setHours(0, 0, 0, 0);
      const userId = state.user.uid;
      
      // Query Firestore for habits belonging to the authenticated user
      const q = query(
        collection(db, 'memos'),
        where('userId', '==', userId),
        where('timestamp', '>=', startOfWeek),
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

        commit('SET_WEEK_MEMOS', memos);
        this.dispatch('getDayMemos', this.state.selectedDay);
      }, (error) => {
        console.error('Error fetching real-time memos:', error);
      });
    },
    async getDayMemos({ commit, state }, day) {
      const startOfDay = new Date(day);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(day);
      endOfDay.setHours(23, 59, 59, 999);

      const dayMemos = state.weekMemos.filter(memo => {
        const memoDate = new Timestamp(memo.timestamp.seconds, memo.timestamp.nanoseconds).toDate();
        return memoDate >= startOfDay && memoDate <= endOfDay;
      })
      
      commit('SET_DAY_MEMOS', dayMemos);
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