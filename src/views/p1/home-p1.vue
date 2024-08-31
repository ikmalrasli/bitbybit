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
              :percent="task.progress * 100 / task.target"
              :text="task.name"
              :timesdone="task.progress.toString() + '/'+ task.target.toString() "
              color="bg-violet-400"
              class="cursor-pointer"
              @click="openDetail(task)"
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
              :percent="task.progress * 100 / task.target"
              :text="task.name"
              :timesdone="task.progress.toString() + '/'+ task.target.toString() "
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
        { id: 'nfjakdnfk', name: "Solat Dhuha", progress: 0, target: 1 },
        { id: 'jfnkjasfk', name: "Sayyidul Istighfar", progress: 1, target: 2 },
        { id: 'fkdnsjnvj', name: "Read Quran", progress: 3, target: 5 },
      ],
      completedTasks: [
        { name: "Solat Sunat Subuh", progress: 1, target: 1 },
        { name: "Kemas katil", progress:1, target: 1 }
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
    openDetail(x){
      this.$router.push({
        name: 'detail-habits',
        params: { habitId: x.id }
      })
    }
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
