import { createStore } from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { db } from '../firebase'; // Import your Firestore instance
import { collection, query, where, onSnapshot, orderBy, addDoc, doc, updateDoc, Timestamp, getDocs, limit, startAfter, getDoc } from 'firebase/firestore';
import { getTotalProgressDay } from '../utils/getTotalProgressDay';
import { useStatStore } from './statStore';
import * as Sentry from "@sentry/vue";

const loadTimeout = 1000;

export default createStore({
  plugins: [
    createPersistedState({
      paths: ['user', 'isAuthenticated', 'sortType', 'pushNotiGranted']
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
    pushNotiGranted: false,
    unsubscribeThisWeek: null,
    unsubscribeLastWeek: null,
    loadingWeekProgress: false,
    unsubscribeProgress: null,
    hasNewNews: false,
    unsubscribeHabits: null,
    pauses: [],
    // loadingMoreHabits: false
  },
  mutations: {
    setPushNotiGranted(state, granted) {
      state.pushNotiGranted = granted;
    },
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
      state.pushNotiGranted = false;
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
      if (!state.selectionMode) state.selectedHabits = [];
    },
    selectHabit(state, habitId) {
      if (state.selectedHabits.includes(habitId)) {
        state.selectedHabits = state.selectedHabits.filter(id => id !== habitId); // Deselect habit
      } else {
        state.selectedHabits.push(habitId);
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
          useStatStore().setProgressUpdated();
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
      if (state.sortType === 'name') {
        state.habits.sort((a, b) => a.name.localeCompare(b.name));
      } else if (state.sortType === 'color') {
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
    setUnsubscribeThisWeek(state, unsubscribe) {
      state.unsubscribeThisWeek = unsubscribe;
    },
    setUnsubscribeLastWeek(state, unsubscribe) {
      state.unsubscribeLastWeek = unsubscribe;
    },
    setLoadingWeekProgress(state, loading) {
      state.loadingWeekProgress = loading;
    },
    setUnsubscribeProgress(state, unsubscribe) {
      if (state.unsubscribeProgress) {
        state.unsubscribeProgress();
      }
      state.unsubscribeProgress = unsubscribe;
    },
    setHasNewNews(state, value) {
      state.hasNewNews = value;
    },
    setUnsubscribeHabits(state, unsubscribe) {
      if (state.unsubscribeHabits) {
        state.unsubscribeHabits(); // Clean up existing listener
      }
      state.unsubscribeHabits = unsubscribe;
    },
    SET_PAUSES(state, pauses) {
      state.pauses = pauses;
    },
    // setLoadingMoreHabits(state, value) {
    //   state.loadingMoreHabits = value;
    // }
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
    updateWeekProgress({ state, commit }, weekProgress) {
      // weekProgress = [...state.weekProgress, ...weekProgress];
      // console.log('updateWeekProgress', weekProgress);
      commit('SET_WEEK_PROGRESS', weekProgress);
    },

    //-------------------------------------------------------------------------------------------

    async login({ commit }, { email, password }) {
      commit('setLoading', true);
      const auth = getAuth();
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        commit('setLoading', false);
        commit('SET_USER', userCredential.user);
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            action: 'login',
            email: email
          }
        });
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
        if (!state.user) return;

        // Query Firestore for habits belonging to the authenticated user
        const q = query(
          collection(db, 'habits'),
          where('userId', '==', state.user.uid),
          orderBy(state.sortType === 'name' ? 'name' : 'index')
        );

        // Set up a real-time listener
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const habits = [];
          querySnapshot.forEach((doc) => {
            habits.push({ habitId: doc.id, ...doc.data() });
          });
          commit('SET_HABITS', habits);
          commit('sortHabits');

          if (habits.length > 0) {
            if (!state.firstFetchHabits) {
              commit('setLoadingWeekProgress', true);
              this.dispatch('fetchWeekProgress', 'thisWeek');
              // Instead, chain pauses and day habits:
              this.dispatch('fetchPauses').then(() => {
                this.dispatch('getDayHabits', state.selectedDay || new Date());
              });
            } else {
              // Always get day habits when habits change
              this.dispatch('fetchPauses').then(() => {
                this.dispatch('getDayHabits', state.selectedDay || new Date());
              });
            }
          } else {
            // If no habits, clear week progress and set loading states to false
            commit('SET_WEEK_PROGRESS', []);
            commit('setLoadingWeekProgress', false);
            commit('setLoadingHome', false);
          }

          // Mark first fetch as complete
          commit('setFirstFetchHabits', true);
        });

        // Store unsubscribe function
        commit('setUnsubscribeHabits', unsubscribe);

      } catch (error) {
        console.error('Error in fetchHabits:', error);
        commit('setLoadingWeekProgress', false);
        commit('setLoadingHome', false);
        commit('setFirstFetchHabits', true);
      }
    },
    async fetchWeekProgress({ commit, state }, weekType = 'thisWeek') {
      try {
        if (!state.habits.length) {
          commit('setLoadingWeekProgress', false);
          commit('setLoadingHome', false);
          return;
        }

        commit('setLoadingWeekProgress', true);

        const today = new Date();
        const currentDayOfWeek = today.getDay();
        const currentDate = today.getDate();

        // Calculate start date based on weekType
        const startOfWeek = new Date(today);
        if (weekType === 'thisWeek') {
          startOfWeek.setDate(currentDate - currentDayOfWeek);
        } else {
          startOfWeek.setDate(currentDate - currentDayOfWeek - 7);
        }
        startOfWeek.setHours(0, 0, 0, 0);

        // Calculate end date
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        endOfWeek.setHours(23, 59, 59, 999);

        // Split habits into batches of 30
        const habitBatches = [];
        for (let i = 0; i < state.habits.length; i += 30) {
          habitBatches.push(state.habits.slice(i, i + 30).map(h => h.habitId));
        }

        // Clean up existing listeners if any
        if (state.unsubscribeProgress) {
          state.unsubscribeProgress();
        }

        // Create a listener for each batch
        const unsubscribes = habitBatches.map(habitIds => {
          const q = query(
            collection(db, 'progress'),
            where('habitId', 'in', habitIds),
            where('timestamp', '>=', startOfWeek),
            where('timestamp', '<', endOfWeek),
            orderBy('timestamp', 'desc')
          );

          return onSnapshot(q, (querySnapshot) => {
            const progressArray = [];
            querySnapshot.forEach((doc) => {
              progressArray.push({ ...doc.data(), progressId: doc.id });
            });

            // Merge with existing progress data
            const existingProgress = state.weekProgress.filter(progress => {
              if (weekType === 'lastWeek') {
                // Keep this week's data when viewing last week
                const progressDate = progress.timestamp.toDate ? progress.timestamp.toDate() : new Date(progress.timestamp);
                return progressDate >= endOfWeek || !habitIds.includes(progress.habitId);
              } else {
                // When viewing this week, only keep progress for habits not in current batch
                return !habitIds.includes(progress.habitId);
              }
            });

            const newProgress = [...existingProgress, ...progressArray];

            // Deduplicate entries keeping only the latest progress for each habit per day
            const outputArray = newProgress.reduce((acc, curr) => {
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
            this.dispatch('getDayHabits', state.selectedDay);

            commit('setLoadingWeekProgress', false);
            commit('setLoadingHome', false);
          }, (error) => {
            Sentry.captureException(error, {
              tags: {
                action: 'fetchWeekProgress',
                weekType: weekType,
                userId: state.user?.uid,
                query: 'progress_habitId_timestamp'
              },
              extra: {
                fullError: error.toString(),
                indexUrl: error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)?.[0] || 'No URL found'
              }
            });
            console.error("Error fetching progress:", error);
            commit('setLoadingWeekProgress', false);
            commit('setLoadingHome', false);
          });
        });

        // Store unsubscribe functions
        commit('setUnsubscribeProgress', () => unsubscribes.forEach(unsub => unsub()));

      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            action: 'fetchWeekProgress',
            weekType: weekType,
            userId: state.user?.uid,
            query: 'progress_habitId_timestamp'
          },
          extra: {
            fullError: error.toString(),
            indexUrl: error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)?.[0] || 'No URL found'
          }
        });
        console.error("Error in fetchWeekProgress:", error);
        commit('setLoadingWeekProgress', false);
        commit('setLoadingHome', false);
      }
    },
    async ensureDayProgressLoaded({ state, dispatch }, day) {
      const dayDate = new Date(day);
      const dayStart = new Date(dayDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayDate);
      dayEnd.setHours(23, 59, 59, 999);

      const timestamps = state.weekProgress.map(p => {
        const ts = p.timestamp;
        return ts?.toDate ? ts.toDate() : new Date(ts?.seconds * 1000 || 0);
      });
      const minTs = timestamps.length ? Math.min(...timestamps.map(d => d.getTime())) : 0;
      const maxTs = timestamps.length ? Math.max(...timestamps.map(d => d.getTime())) : 0;
      const isCovered = timestamps.length > 0 &&
        dayEnd.getTime() >= minTs &&
        dayStart.getTime() <= maxTs;

      if (isCovered) return;

      if (!state.habits?.length) return;

      const habitIds = state.habits.map(h => h.habitId);
      const batchSize = 30;
      const allBatchProgress = [];

      for (let i = 0; i < habitIds.length; i += batchSize) {
        const batchIds = habitIds.slice(i, i + batchSize);
        const q = query(
          collection(db, 'progress'),
          where('habitId', 'in', batchIds),
          where('timestamp', '>=', dayStart),
          where('timestamp', '<=', dayEnd),
          orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);
        const batchProgress = snapshot.docs.map(d => ({
          ...d.data(),
          progressId: d.id
        }));
        allBatchProgress.push(...batchProgress);
      }

      if (allBatchProgress.length > 0) {
        const merged = [...state.weekProgress, ...allBatchProgress];
        const outputArray = merged.reduce((acc, curr) => {
          const currentDate = curr.timestamp?.toDate ? curr.timestamp.toDate() : new Date(curr.timestamp);
          const currentDay = new Date(currentDate).setHours(0, 0, 0, 0);

          const existingHabit = acc.find(habit => {
            const habitDate = habit.timestamp?.toDate ? habit.timestamp.toDate() : new Date(habit.timestamp);
            const existingDay = new Date(habitDate).setHours(0, 0, 0, 0);
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
        dispatch('updateWeekProgress', outputArray);
      }
    },
    async getDayHabits({ commit, state, dispatch }, day) {
      await dispatch('ensureDayProgressLoaded', day);
      const { endHabits } = getTotalProgressDay(day, state.weekProgress, state.habits, state.pauses);
      commit('SET_DAY_HABITS', endHabits);
      commit('setLoadingHome', false);
      this.dispatch('fetchWeekMemos');
    },
    async fetchWeekMemos({ commit, state }) {
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
    },
    // Keep these actions for week switching
    showLastWeek({ dispatch }) {
      dispatch('fetchWeekProgress', 'lastWeek');
    },
    showThisWeek({ dispatch }) {
      dispatch('fetchWeekProgress', 'thisWeek');
    },
    async checkForNewNews({ commit }) {
      const auth = getAuth();
      if (!auth.currentUser) return;

      try {
        // Get user's last read timestamp
        const userNewsRef = doc(db, "users", auth.currentUser.uid, "metadata", "news");
        const userNewsDoc = await getDoc(userNewsRef);
        const lastRead = userNewsDoc.exists() ? userNewsDoc.data().lastRead : null;

        // Get latest news timestamp
        const newsQuery = query(collection(db, "news"), orderBy("date", "desc"), limit(1));
        const newsSnapshot = await getDocs(newsQuery);

        if (!newsSnapshot.empty) {
          const latestNews = newsSnapshot.docs[0].data().date;

          // If no lastRead or if there's newer news, show indicator
          const hasNewNews = !lastRead || latestNews > lastRead;
          commit('setHasNewNews', hasNewNews);
        }
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            action: 'checkForNewNews',
            userId: auth.currentUser?.uid
          }
        });
        console.error("Error checking for new news:", error);
      }
    },
    async fetchPauses({ commit, state }) {
      if (!state.user) return;
      const habitIds = state.habits.map(h => h.habitId);
      if (habitIds.length === 0) {
        commit('SET_PAUSES', []);
        return;
      }
      // Firestore only allows 'in' queries for up to 30 items
      const pauseDocs = [];
      for (let i = 0; i < habitIds.length; i += 30) {
        const batchIds = habitIds.slice(i, i + 30);
        const q = query(
          collection(db, 'pauses'),
          where('habitId', 'in', batchIds)
        );
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
          pauseDocs.push({ pauseId: doc.id, ...doc.data() });
        });
      }
      console.log('Fetched pauses:', pauseDocs);
      commit('SET_PAUSES', pauseDocs);
    },
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