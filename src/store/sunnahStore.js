import { defineStore } from 'pinia';
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';

export const useSunnahStore = defineStore('sunnahStore', {
  state: () => ({
    allSunnahs: [],
    selectedSunnah: null,
  }),
  getters: {
    dailySunnahs: (state) => {
      return state.allSunnahs.filter(sunnah => {
        const repeat = sunnah.repeat || {};
        return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].every(day => repeat[day] === true);
      }).sort((a, b) => a.name.localeCompare(b.name));
    },
    weeklySunnahs: (state) => {
      return state.allSunnahs.filter(sunnah => {
        const repeat = sunnah.repeat || {};
        return !['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].every(day => repeat[day] === true);
      }).sort((a, b) => a.name.localeCompare(b.name));
    },
  },
  actions: {
    setSelectedSunnah(sunnah) {
      this.selectedSunnah = sunnah;
    },
    clearSelectedSunnah() {
      this.selectedSunnah = null;
    },
    fetchSunnahs() {
      const q = query(collection(db, 'sunnahs'));
      onSnapshot(q, (querySnapshot) => {
        const sunnahs = [];
        querySnapshot.forEach((doc) => {
          sunnahs.push({ sunnahId: doc.id, ...doc.data() });
        });
        this.allSunnahs = sunnahs;
      }, (error) => {
        console.error('Error fetching sunnahs:', error);
      });
    },
    getSunnahById(sunnahId) {
      return this.allSunnahs.find(sunnah => sunnah.sunnahId === sunnahId);
    },
  },
});
