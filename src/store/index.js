import { createStore } from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { db as firestoreDb } from '../firebase'; // Firestore instance (renamed to avoid conflict)
import { db } from '../db'; // Dexie IndexedDB instance
import { migrateUserFromFirebase } from '../utils/migrateFromFirebase';
import { toTimestampLike, toMillis } from '../utils/timestampUtils';
import { performFullSync, markForSync, initializeSyncEngine } from '../utils/syncEngine';
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
          const docRef = db.progress.get(habit.progressId);
          return db.progress.update(habit.progressId, {
            progress: habit.dailyGoal,
            timestamp: setTimestamp,
            onTime: onTime,
            syncStatus: 'pending',
            updatedAt: Date.now()
          });
        } else {
          return db.progress.add({
            habitId: habit.habitId,
            progress: habit.dailyGoal,
            timestamp: setTimestamp,
            onTime: onTime,
            syncStatus: 'pending',
            updatedAt: Date.now()
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
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            try {
              await migrateUserFromFirebase(user);
            } catch (err) {
              console.error('[Migration]', err);
              Sentry.captureException(err, { tags: { action: 'migrateUserFromFirebase' } });
            }
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

        // Read habits from Dexie (IndexedDB) instead of Firestore
        const habitsRaw = await db.habits
          .where('userId')
          .equals(state.user.uid)
          .toArray();

        // Convert timestamps back to Firestore-like format for compatibility
        const habits = habitsRaw.map(h => ({
          ...h,
          habitId: h.id, // Ensure habitId is set (already in migration)
          termStart: toTimestampLike(h.termStart),
          termEnd: toTimestampLike(h.termEnd),
          createdAt: toTimestampLike(h.createdAt),
        }));

        commit('SET_HABITS', habits);
        commit('sortHabits');

        if (habits.length > 0) {
          if (!state.firstFetchHabits) {
            commit('setLoadingWeekProgress', true);
            this.dispatch('fetchWeekProgress', 'thisWeek');
            this.dispatch('fetchPauses').then(() => {
              this.dispatch('getDayHabits', state.selectedDay || new Date());
            });
          } else {
            this.dispatch('fetchPauses').then(() => {
              this.dispatch('getDayHabits', state.selectedDay || new Date());
            });
          }
        } else {
          commit('SET_WEEK_PROGRESS', []);
          commit('setLoadingWeekProgress', false);
          commit('setLoadingHome', false);
        }

        commit('setFirstFetchHabits', true);
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
        const startOfWeekMs = startOfWeek.getTime();

        // Calculate end date
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        endOfWeek.setHours(23, 59, 59, 999);
        const endOfWeekMs = endOfWeek.getTime();

        // Get all habit IDs
        const habitIds = state.habits.map(h => h.habitId);

        // Query Dexie for progress in the week range
        // Use anyOf on habitId and filter by timestamp
        const progressRaw = await db.progress
          .where('habitId')
          .anyOf(habitIds)
          .toArray();

        // Filter by timestamp range (timestamps are stored as milliseconds)
        const filteredProgress = progressRaw.filter(p =>
          p.timestamp >= startOfWeekMs && p.timestamp < endOfWeekMs
        );

        // Convert timestamps back to Firestore-like format
        const progressArray = filteredProgress.map(p => ({
          ...p,
          progressId: p.id,
          timestamp: toTimestampLike(p.timestamp),
        }));

        // Deduplicate entries keeping only the latest progress for each habit per day
        const outputArray = progressArray.reduce((acc, curr) => {
          const currentDateMs = toMillis(curr.timestamp);
          const currentDay = new Date(currentDateMs).setHours(0, 0, 0, 0);

          const existingHabit = acc.find(habit => {
            const habitDateMs = toMillis(habit.timestamp);
            const existingDay = new Date(habitDateMs).setHours(0, 0, 0, 0);
            return habit.habitId === curr.habitId && existingDay === currentDay;
          });

          if (existingHabit) {
            const currTs = toMillis(curr.timestamp);
            const existingTs = toMillis(existingHabit.timestamp);
            if (currTs >= existingTs) {
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
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            action: 'fetchWeekProgress',
            weekType: weekType,
            userId: state.user?.uid,
            source: 'Dexie'
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
      const dayStartMs = dayStart.getTime();
      const dayEnd = new Date(dayDate);
      dayEnd.setHours(23, 59, 59, 999);
      const dayEndMs = dayEnd.getTime();

      // Check if the day is already covered by weekProgress
      const timestamps = state.weekProgress.map(p => toMillis(p.timestamp) || 0);
      const minTs = timestamps.length ? Math.min(...timestamps) : 0;
      const maxTs = timestamps.length ? Math.max(...timestamps) : 0;
      const isCovered = timestamps.length > 0 &&
        dayEndMs >= minTs &&
        dayStartMs <= maxTs;

      if (isCovered) return;

      if (!state.habits?.length) return;

      // Query Dexie for progress in the day range
      const habitIds = state.habits.map(h => h.habitId);
      const progressRaw = await db.progress
        .where('habitId')
        .anyOf(habitIds)
        .toArray();

      // Filter by day range
      const dayProgress = progressRaw.filter(p =>
        p.timestamp >= dayStartMs && p.timestamp <= dayEndMs
      );

      if (dayProgress.length > 0) {
        // Convert timestamps and merge
        const newProgress = dayProgress.map(p => ({
          ...p,
          progressId: p.id,
          timestamp: toTimestampLike(p.timestamp),
        }));

        const merged = [...state.weekProgress, ...newProgress];
        const outputArray = merged.reduce((acc, curr) => {
          const currentDateMs = toMillis(curr.timestamp) || 0;
          const currentDay = new Date(currentDateMs).setHours(0, 0, 0, 0);

          const existingHabit = acc.find(habit => {
            const habitDateMs = toMillis(habit.timestamp) || 0;
            const existingDay = new Date(habitDateMs).setHours(0, 0, 0, 0);
            return habit.habitId === curr.habitId && existingDay === currentDay;
          });

          if (existingHabit) {
            const currTs = toMillis(curr.timestamp) || 0;
            const existingTs = toMillis(existingHabit.timestamp) || 0;
            if (currTs >= existingTs) {
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
      if (!state.user?.uid) return;

      try {
        const today = new Date();
        const currentDayOfWeek = today.getDay();
        const currentDate = today.getDate();

        // Get memos for the last 2 weeks (this week + last week)
        const startOfWeek = new Date(today);
        startOfWeek.setDate(currentDate - currentDayOfWeek - 7);
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfWeekMs = startOfWeek.getTime();

        // Query Dexie for memos
        const memosRaw = await db.memos
          .where('userId')
          .equals(state.user.uid)
          .toArray();

        // Filter by timestamp (last 2 weeks) and convert timestamps
        const memos = memosRaw
          .filter(m => m.timestamp >= startOfWeekMs)
          .map(m => ({
            ...m,
            memoId: m.id,
            timestamp: toTimestampLike(m.timestamp),
          }));

        commit('SET_WEEK_MEMOS', memos);
        this.dispatch('getDayMemos', this.state.selectedDay);
      } catch (error) {
        console.error('Error fetching memos from Dexie:', error);
        Sentry.captureException(error, {
          tags: {
            action: 'fetchWeekMemos',
            userId: state.user?.uid,
            source: 'Dexie'
          }
        });
      }
    },
    async getDayMemos({ commit, state }, day) {
      const startOfDay = new Date(day);
      startOfDay.setHours(0, 0, 0, 0);
      const startOfDayMs = startOfDay.getTime();
      const endOfDay = new Date(day);
      endOfDay.setHours(23, 59, 59, 999);
      const endOfDayMs = endOfDay.getTime();

      const dayMemos = state.weekMemos.filter(memo => {
        const memoDateMs = toMillis(memo.timestamp) || 0;
        return memoDateMs >= startOfDayMs && memoDateMs <= endOfDayMs;
      });

      commit('SET_DAY_MEMOS', dayMemos);
    },
    fetchSunnahs({ commit }) {
      const sunnahs = [];
      // Fetch sunnahs from Firestore (admin/shared data - keep Firebase for now)
      onSnapshot(query(collection(firestoreDb, 'sunnahs')), (snapshot) => {
        sunnahs.length = 0; // Clear to avoid duplicates
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
        // Get user's last read timestamp from Dexie
        const userMeta = await db.user_metadata.get(`news_${auth.currentUser.uid}`);
        const lastReadMs = userMeta?.lastRead || null;

        // Get latest news timestamp from Firestore (admin data - keep Firebase)
        const newsQuery = query(collection(firestoreDb, "news"), orderBy("date", "desc"), limit(1));
        const newsSnapshot = await getDocs(newsQuery);

        if (!newsSnapshot.empty) {
          const latestNewsTs = newsSnapshot.docs[0].data().date;
          const latestNewsMs = toMillis(latestNewsTs);

          // If no lastRead or if there's newer news, show indicator
          const hasNewNews = !lastReadMs || (latestNewsMs && latestNewsMs > lastReadMs);
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

      try {
        // Query Dexie for pauses (no batch limit needed for IndexedDB)
        const pausesRaw = await db.pauses
          .where('habitId')
          .anyOf(habitIds)
          .toArray();

        // Convert timestamps back to Firestore-like format
        const pauses = pausesRaw.map(p => ({
          ...p,
          pauseId: p.id,
          start: toTimestampLike(p.start),
          end: toTimestampLike(p.end),
        }));

        console.log('Fetched pauses from Dexie:', pauses);
        commit('SET_PAUSES', pauses);
      } catch (error) {
        console.error('Error fetching pauses from Dexie:', error);
        Sentry.captureException(error, {
          tags: {
            action: 'fetchPauses',
            userId: state.user?.uid,
            source: 'Dexie'
          }
        });
        commit('SET_PAUSES', []);
      }
    },
    // Sync Engine Actions
    async performSync({ commit, state }) {
      if (!state.user) {
        console.warn('[Store] Cannot sync: no authenticated user');
        return;
      }
      
      try {
        commit('setLoading', true);
        await performFullSync();
        
        // Refresh data after sync
        await this.dispatch('fetchHabits');
        
        console.log('[Store] Sync completed successfully');
      } catch (error) {
        console.error('[Store] Sync failed:', error);
        Sentry.captureException(error, {
          tags: {
            action: 'store_performSync',
            userId: state.user?.uid
          }
        });
        throw error;
      } finally {
        commit('setLoading', false);
      }
    },
    async markRecordForSync({ state }, { tableName, recordId }) {
      if (!state.user) return;
      
      try {
        await markForSync(tableName, recordId);
      } catch (error) {
        console.error(`[Store] Failed to mark ${recordId} for sync:`, error);
        Sentry.captureException(error, {
          tags: {
            action: 'markRecordForSync',
            table: tableName,
            userId: state.user?.uid
          }
        });
      }
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