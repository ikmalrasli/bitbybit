<template>
    <div class="p-4 w-full">
        <!-- Daily Sunnah (Collapsible Section) -->
      <div class="mb-4">
        <div class="flex justify-between items-center cursor-pointer" @click="toggleDaily">
          <span class="font-semibold text-black">Daily</span>
          <span v-if="showDaily" class="material-icons">keyboard_arrow_up</span>
          <span v-else class="material-icons">keyboard_arrow_down</span>
        </div>

        <!-- Uncompleted Tasks List -->
        <div v-show="showDaily" class="mb-4 py-4 transition-all duration-300 ease-in-out">
          <div
            v-for="sunnah in Daily"
            :key="sunnah"
            class="mb-2"
          >
            <div class="w-full p-8 mb-4 bg-white shadow-md rounded-xl cursor-pointer" @click="clicked">
                <div class="flex justify-between">
                <span class="text-left font-normal text-black">{{sunnah.name}}</span>
                <span class="material-icons">chevron_right</span>
                </div>
            </div>
          </div>
        </div>
    </div>

        <div class="mb-4">
        <div class="flex justify-between items-center cursor-pointer" @click="toggleWeekly">
          <span class="font-semibold text-black">Weekly</span>
          <span v-if="showWeekly" class="material-icons">keyboard_arrow_up</span>
          <span v-else class="material-icons">keyboard_arrow_down</span>
        </div>

        <!-- Uncompleted Tasks List -->
        <div v-show="showWeekly" class="mb-4 py-4 transition-all duration-300 ease-in-out">
          <div
            v-for="sunnah in Weekly"
            :key="sunnah"
            class="mb-2"
          >
            <div class="w-full p-8 mb-4 bg-white shadow-md rounded-xl cursor-pointer" @click="clicked">
                <div class="flex justify-between">
                <span class="text-left font-normal text-black">{{sunnah.name}}</span>
                <span class="material-icons">chevron_right</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
</template>

<script>
import titleBar from '../../components/title-bar.vue';
export default {
  components:{
    titleBar
  },
  data() {
    return {
      showDaily: true,
      showWeekly: true,
      Daily: [
        { name: "Ayatul Kursi before sleep", description: "" },
        { name: "Doa after Wudhu", description: "" },
        { name: "Sedekah Subuh", description: "" },
      ],
      Weekly: [
        { name: "Fasting on Mondays and Thurdays", description: "" },
        { name: "Recite Al-Kahfi on Fridays", description: "" }
      ]
    };
  },
  methods: {
    toggleDaily() {
      this.showDaily = !this.showDaily;
    },
    toggleWeekly() {
      this.showWeekly = !this.showWeekly;
    },
    clicked(){
        alert("you've clicked a component!");
    }
  },
};
</script>