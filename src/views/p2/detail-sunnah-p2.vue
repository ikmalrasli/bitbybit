<template>
  <div v-if="sunnah" class="w-full h-full flex flex-col relative overflow-hidden">
    <!-- Header -->
    <header class="h-14 bg-white p-4 flex flex-row flex-shrink-0">
      <button @click="goBack" class="material-icons">chevron_left</button>
      <h1 class="text-lg text-black font-bold truncate w-full text-center">
        {{sunnah.name}}</h1>
    </header>
    
    <!-- Content -->
    <p class="h-96 flex-grow p-4 pb-20 scrollbar-hide overflow-y-auto" style="white-space: pre-wrap;">{{ sunnah.description }}</p>

    <!-- Create Button -->
    <div class="px-4 py-2 flex-shrink-0 absolute bottom-0 w-full">
      <button @click="addToHabits" 
      class="w-full bg-violet-400 text-white font-bold py-3 rounded-full shadow-lg hover:bg-violet-500">
        Add to habits
      </button>
    </div>
    
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  data() {
    return {
      sunnah: null
    };
  },
  computed: {
    ...mapGetters(['allSunnahs']),
  },
  methods: {
    fetchSunnahDetail() {
      const sunnahId = this.$route.params.sunnahId;
      this.sunnah = this.allSunnahs.find(sunnah => sunnah.sunnahId === sunnahId);
    },
    goBack() {
      this.$router.push('/sunnahs');
    },
    addToHabits() {
      this.$store.commit('setSelectedSunnah', this.sunnah);
      this.$router.push({
        name: 'add-sunnah',  // Assuming this is the name of the route
        params: {
          sunnahId: this.sunnah.sunnahId
        }
      });
    }
  },
  watch: {
    '$route.params.sunnahId': 'fetchSunnahDetail'
  },
  mounted() {
    this.fetchSunnahDetail();
  }
};
</script>
