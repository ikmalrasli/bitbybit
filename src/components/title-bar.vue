<template>
  <div class="w-full flex justify-between items-center bg-white px-4 py-2 h-14">
    <!-- Sidebar Toggle Button for Mobile -->
    <span @click="toggleSidebar" class="material-icons md:invisible ">
      menu
    </span>
    <!-- Title (Centered) -->
    <div class="text-center font-bold text-xl">
      {{ displayTitle }}
    </div>
    <button v-if="isHome()" @click="openAddPage" class="cursor-pointer material-icons">
      add
    </button>
    <button v-else class="material-icons invisible">add</button>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  props: {
    title: {
      type: String,
      default: "Hello"
    }
  },
  computed: {
    ...mapGetters(['getSelectedDay']), // Map the Vuex getter
    displayTitle() {
      if (this.$route.name === "home" ||  
      this.$route.name === "add-habit" ||
      this.$route.name === "detail-habit") {
      return this.getSelectedDay; // Use the globally selected date
      }
      return this.title; // Otherwise, use the passed-in title
    }
  },
  methods: {
    toggleSidebar() {
      this.$emit("toggle-sidebar");
    },
    isHome() {
      return this.$route.name === "home" || this.$route.name === "detail-habit";
    },
    openAddPage() {
      this.$router.push('/add-habit');
    }
  }
};
</script>

<style scoped>
.hover\:bg-slate-100:hover {
  background-color: #f3f4f6;
}
</style>
