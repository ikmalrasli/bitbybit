<template>
  <div class="w-full relative flex items-center bg-white px-4 py-2">
    <!-- Sidebar Toggle Button for Mobile -->
    <span @click="toggleSidebar" class="material-icons md:hidden absolute left-2">
      menu
    </span>
    <!-- Title (Centered) -->
    <div class="w-full text-center text-black font-bold text-xl">
      {{ title }}
    </div>
    <span @click="openAddPage" class="material-icons absolute right-2 hover:bg-slate-100">
      add
    </span>
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
    openAddPage() {
      this.$emit("show-page");
    }
  }
};
</script>

<style scoped>
.material-icons {
  cursor: pointer;
}
</style>
