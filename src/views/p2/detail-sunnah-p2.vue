<template>
  <div class="w-full h-full flex flex-col flex">
    <div v-if="sunnah" class="w-full h-full flex flex-col bg-white">
      <!-- Header -->
      <header class="bg-white p-4 flex flex-row relative">
        <button @click="goBack" class="material-icons">chevron_left</button>
        <h1 class="text-lg text-black font-bold absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">{{sunnah.name}}</h1>
      </header>

      <!-- Content -->
      <p class="mt-2 p-4 overflow-y-auto h-full" style="white-space: pre-wrap;">{{ sunnah.description }}</p>

      <!-- Create Button -->
      <div class="sticky bottom-0 p-4">
        <button v-if="sunnah" @click="addToHabits" class="w-full bg-violet-400 text-white font-bold py-3 rounded-lg shadow-lg">
          Add to habits 
        </button>
      </div>
    </div>
    <div v-else>
      <p>Loading...</p>
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
