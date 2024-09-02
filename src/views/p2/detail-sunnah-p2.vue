<template>
    <div class="w-full h-full flex flex-row">
      <div class="w-full h-full flex flex-col bg-white">
        <!-- Header -->
        <header class="bg-white p-4 flex flex-row relative">
          <button @click="goBack" class="material-icons">chevron_left</button>
          <h1 class="text-lg text-black font-semibold absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">{{sunnahData?.name}}</h1>
        </header>
      </div>
    </div>
</template>

<script>
  export default {
    props: {
      sunnahId: {
        type: String,
        required: true
      }
    },
    data() {
      return {
        sunnahData: null,
        allSunnahs: [
            { id: 'bfghjadfsbg', name: "Ayatul Kursi before sleep", frequency: "Daily" },
            { id: 'gbndfjhgkjg', name: "Doa after Wudhu", frequency: "Daily" },
            { id: 'erutyhyiure', name: "Sedekah Subuh", frequency: "Daily" },
            { id: 'ureyutiirti', name: "Fasting on Mondays and Thurdays", frequency: "Weekly" },
            { id: 'fuighufhguh', name: "Recite Al-Kahfi on Fridays", frequency: "Weekly" }
        ]
      };
    },
    created() {
      this.loadSunnahData();
    },
    watch: {
      sunnahId(newId, oldId) {
        if (newId !== oldId) {
          this.loadSunnahData();
        }
      }
    },
    methods: {
      loadSunnahData() {
        this.sunnahData = this.allSunnahs.find(sunnah => sunnah.id === this.sunnahId);
  
        if (!this.sunnahData) {
          console.error(`Habit with ID ${this.sunnahId} not found.`);
        }
      },
      goBack() {
        // Go back to the previous page
        this.$router.go(-1);
      },
    }
  }
  </script>