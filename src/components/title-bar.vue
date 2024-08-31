<template>
  <div class="w-full flex justify-between items-center bg-white px-4 py-2 h-14">
    <!-- Sidebar Toggle Button for Mobile -->
    <span @click="toggleSidebar" class="material-icons md:invisible ">
      menu
    </span>
    <!-- Title (Centered) -->
    <div class="text-center font-bold text-xl">
      {{ title }}
    </div>
    <span v-if="isHome()" @click="openAddPage" class="material-icons hover:bg-slate-100">
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
  methods: {
    toggleSidebar() {
      this.$emit("toggle-sidebar");
    },
    isHome() {
      if (this.$route.path === "/" || this.$route.path === '/detail/:habitId') {
        return true;
      }
    },
    openAddPage() {
      this.$router.push('/add-habit');
    }
  }
};
</script>

<style scoped>
.material-icons {
  cursor: pointer;
}
</style>
