import { defineStore } from 'pinia';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { doc, getDoc, getDocs, collection, query, orderBy, limit } from 'firebase/firestore';
import * as Sentry from "@sentry/vue";

export const useUIStore = defineStore('uiStore', {
  state: () => ({
    loading: false, // Start false, let the fetch/login set it to true
    selectedDate: new Date(),
    sortType: localStorage.getItem('habit-home-sortType') || 'name', // Default sort type with persistence
    selectedHabits: [],
    selectionMode: false,
    hasNewNews: false,
  }),
  getters: {
    isLoading: (state) => state.loading,
  },
  actions: {
    setLoading(value) {
      this.loading = value;
    },
    setSelectedDate(date) {
      this.selectedDate = date;
    },
    setSortType(type) {
      this.sortType = type;
      localStorage.setItem('habit-home-sortType', type);
    },
    toggleSelectionMode() {
      this.selectionMode = !this.selectionMode;
      if (!this.selectionMode) this.selectedHabits = [];
    },
    selectHabit(habitId) {
      console.log('selectHabit', habitId);
      if (this.selectedHabits.includes(habitId)) {
        this.selectedHabits = this.selectedHabits.filter(id => id !== habitId); // Deselect habit
      } else {
        this.selectedHabits.push(habitId);
      }
    },
    setHasNewNews(value) {
      this.hasNewNews = value;
    },
    async checkForNewNews() {
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
          this.setHasNewNews(hasNewNews);
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
  }
});