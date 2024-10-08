<template>
  <div class="w-full p-2 sm:p-4">
    <!-- Daily Sunnah (Collapsible Section) -->
    <div class="mb-4">
      <div class="flex justify-between items-center cursor-pointer" @click="toggleSection('Daily')">
        <span class="font-semibold text-black">Daily</span>
        <span v-if="showDaily" class="material-icons">keyboard_arrow_up</span>
        <span v-else class="material-icons">keyboard_arrow_down</span>
      </div>

      <!-- Daily Tasks List -->
      <div v-show="showDaily" class="mb-4 py-4 transition-all duration-300 ease-in-out">
        <div
          v-for="sunnah in dailySunnahs"
          :key="sunnah.id"
          class="mb-2"
        >
          <div class="w-full p-8 mb-4 bg-white border rounded-lg cursor-pointer" @click="openDetail(sunnah)">
            <div class="flex justify-between">
              <span class="text-left font-normal text-black">{{ sunnah.name }}</span>
              <span class="material-icons">chevron_right</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Weekly Sunnah (Collapsible Section) -->
    <div class="mb-4">
      <div class="flex justify-between items-center cursor-pointer" @click="toggleSection('Weekly')">
        <span class="font-semibold text-black">Weekly</span>
        <span v-if="showWeekly" class="material-icons">keyboard_arrow_up</span>
        <span v-else class="material-icons">keyboard_arrow_down</span>
      </div>

      <!-- Weekly Tasks List -->
      <div v-show="showWeekly" class="mb-4 py-4 transition-all duration-300 ease-in-out">
        <div
          v-for="sunnah in weeklySunnahs"
          :key="sunnah.sunnahId"
          class="mb-2"
        >
          <div class="w-full p-8 mb-4 bg-white border rounded-lg cursor-pointer" @click="openDetail(sunnah)">
            <div class="flex justify-between">
              <span class="text-left font-normal text-black">{{ sunnah.name }}</span>
              <span class="material-icons">chevron_right</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from '../../firebase'; // Import your Firestore instance
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';

export default {
  data() {
    return {
      showDaily: true,
      showWeekly: true,
    };
  },
  computed: {
    allSunnahs() {
      return this.$store.getters.allSunnahs;
    },
    dailySunnahs() {
      return this.allSunnahs.filter(sunnah => {
        const repeat = sunnah.repeat || {};
        // Check if all days (sun, mon, tue, ..., sat) are true, defaulting missing days to false
        return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].every(day => repeat[day] === true);
      }).sort((a, b) => a.name.localeCompare(b.name));;
    },
    weeklySunnahs() {
      return this.allSunnahs.filter(sunnah => {
        const repeat = sunnah.repeat || {};
        // Check if not all days are true
        return !['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].every(day => repeat[day] === true);
      }).sort((a, b) => a.name.localeCompare(b.name));;
    }
},
  methods: {
    toggleSection(section) {
      if (section === 'Daily') {
        this.showDaily = !this.showDaily;
      } else if (section === 'Weekly') {
        this.showWeekly = !this.showWeekly;
      }
    },
    async getSunnahs() {
      try {
        // Query Firestore for habits belonging to the authenticated user
        const q = query(
          collection(db, 'sunnahs')
        );
        
        // Set up a real-time listener
        onSnapshot(q, (querySnapshot) => {
          const sunnahs = [];
          querySnapshot.forEach((doc) => {
            sunnahs.push({ sunnahId: doc.id, ...doc.data() });
            this.allSunnahs = sunnahs;
          });
          console.log(this.allSunnahs);

          
        }, (error) => {
          console.error('Error fetching real-time habits:', error);
        });
      } catch (error) {
        console.error('try failed at fetchHabits:', error);
      }
    },
    openDetail(sunnah) {
      this.$router.push({
        name: 'detail-sunnah',
        params: { sunnahId: sunnah.sunnahId }
      });
    }
  },
  mounted() {
    this.$store.dispatch('fetchSunnahs');
  }
};
</script>

<style scoped>
/* Add any additional styling if needed */
</style>
