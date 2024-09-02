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
    <span v-if="isHome()" @click="openAddPage" class="cursor-pointer material-icons hover:bg-slate-100">
      add
    </span>
    <span v-else class="material-icons invisible">add</span>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: "Hello"
    }
  },
  inject: ["selectedDate"], // Inject the global selected date
  computed: {
    displayTitle() {
      if (this.$route.path === "/" || this.$route.path === "/home") {
      return this.selectedDate(); // Use the globally selected date
      }
      return this.title; // Otherwise, use the passed-in title
    }
  },
  methods: {
    toggleSidebar() {
      this.$emit("toggle-sidebar");
    },
    isHome() {
      return this.$route.path === "/" || this.$route.path === "/home";
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
