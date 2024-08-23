<template>
    <div class="p-4 w-full">
        <div class="mb-4 py-4">
          <div
            v-for="habit in habits"
            :key="habit"
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
</template>

<script>
export default {
  data() {
    return {
      habits: [
        { name: "Ayatul Kursi before sleep", description: "" },
        { name: "Doa after Wudhu", description: "" },
        { name: "Sedekah Subuh", description: "" },
      ]
    };
  },
  methods: {
    clicked(){
        alert("you've clicked a component!");
    }
  },
};
</script>