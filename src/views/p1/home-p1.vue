<template>
<div class="w-full flex flex-row p-4">
  <div class="flex-auto">
    
    <!-- Day Selector (Responsive) -->
    <div class="flex justify-start overflow-x-auto mb-4 scrollbar-hide">
      <calendarRow @date-selected="handleDateSelected" />
    </div>

    <!-- Collapsible Section -->
    <div class="mb-4">
      <!-- Uncompleted Tasks -->
      <div class="mb-4">
        <div class="flex justify-between items-center cursor-pointer" @click="toggleUncompleted">
          <span class="font-bold text-black">Uncompleted
            <span class="pl-2 font-medium text-gray-500">{{ uncompletedTasks.length }}</span>
          </span>
          <span v-if="showUncompleted" class="material-icons">keyboard_arrow_up</span>
          <span v-else class="material-icons">keyboard_arrow_down</span>
        </div>

        <!-- Uncompleted Tasks List -->
        <div v-show="showUncompleted" class="mb-4 py-4 transition-all duration-300 ease-in-out">
          <div v-for="(task, index) in uncompletedTasks" :key="index" class="mb-2">
            <HomeProgress 
              :progress="task.percentComplete"
              :text="task.name"
              :timesdone="task.progress"
              color="bg-violet-400"
            />
          </div>
        </div>
      </div>

      <!-- Completed Tasks -->
      <div class="flex justify-between items-center cursor-pointer" @click="toggleCompleted">
        <span class="font-bold text-black">Completed
          <span class="pl-2 font-medium text-gray-500">{{ completedTasks.length }}</span>
        </span>
        <span v-if="showCompleted" class="material-icons">keyboard_arrow_up</span>
        <span v-else class="material-icons">keyboard_arrow_down</span>
      </div>

      <!-- Completed Tasks List -->
      <div v-show="showCompleted" class="py-4 transition-all duration-300 ease-in-out">
        <div v-for="(task, index) in completedTasks" :key="index" class="mb-2">
          <HomeProgress 
            :progress="task.percentComplete"
            :text="task.name"
            :timesdone="task.progress"
            color="bg-violet-400"
          />
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import calendarRow from "../../components/calendar-row.vue";
import HomeProgress from "../../components/home-progressbar.vue";

export default {
  components: {
    calendarRow,
    HomeProgress,
  },
  inject: ["updateTitle"], // Inject the updateTitle method from parent
  data() {
    return {
      showUncompleted: true,
      showCompleted: true,
      uncompletedTasks: [
        { name: "Solat Dhuha", progress: "0/1", percentComplete: 0 },
        { name: "Sayyidul Istighfar", progress: "1/2", percentComplete: 50 },
        { name: "Read Quran", progress: "2/5", percentComplete: 40 },
      ],
      completedTasks: [
        { name: "Solat Sunat Subuh", progress: "1/1", percentComplete: 100 },
        { name: "Kemas katil", progress: "1/1", percentComplete: 100 }
      ],
    };
  },
  methods: {
    toggleUncompleted() {
      this.showUncompleted = !this.showUncompleted;
    },
    toggleCompleted() {
      this.showCompleted = !this.showCompleted;
    },
    handleDateSelected(date) {
      if (this.$route.path === "/" || this.$route.path === "/home") {
        this.updateTitle(date); // Call the injected updateTitle method
      }
    },
  },
};
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.cursor-pointer {
  cursor: pointer;
}
</style>
