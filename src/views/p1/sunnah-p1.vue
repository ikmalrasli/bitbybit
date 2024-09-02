<template>
  <div class="p-4 w-full">
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
          <div class="w-full p-8 mb-4 bg-white shadow-md rounded-xl cursor-pointer" @click="openDetail(sunnah)">
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
          :key="sunnah.id"
          class="mb-2"
        >
          <div class="w-full p-8 mb-4 bg-white shadow-md rounded-xl cursor-pointer" @click="openDetail(sunnah)">
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
export default {
  data() {
    return {
      showDaily: true,
      showWeekly: true,
      allSunnahs: [
        { id: 'bfghjadfsbg', name: "Ayatul Kursi before sleep", frequency: "Daily" },
        { id: 'gbndfjhgkjg', name: "Doa after Wudhu", frequency: "Daily" },
        { id: 'erutyhyiure', name: "Sedekah Subuh", frequency: "Daily" },
        { id: 'ureyutiirti', name: "Fasting on Mondays and Thursdays", frequency: "Weekly" },
        { id: 'fuighufhguh', name: "Recite Al-Kahfi on Fridays", frequency: "Weekly" }
      ],
    };
  },
  computed: {
    dailySunnahs() {
      return this.allSunnahs.filter(sunnah => sunnah.frequency === 'Daily');
    },
    weeklySunnahs() {
      return this.allSunnahs.filter(sunnah => sunnah.frequency === 'Weekly');
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
    openDetail(sunnah) {
      this.$router.push({
        name: 'detail-sunnah',
        params: { sunnahId: sunnah.id }
      });
    }
  }
};
</script>

<style scoped>
/* Add any additional styling if needed */
</style>
