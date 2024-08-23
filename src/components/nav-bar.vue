<template>
  <div>
    <!-- Overlay for mobile mode -->
    <div 
      v-if="showSidebar" 
      class="absolute inset-0 z-30 bg-black opacity-50 md:hidden" 
      @click="toggleSidebar"
    ></div>

    <!-- Sidebar -->
    <div
      :class="[
        'absolute top-0 left-0 h-full z-40 transition-transform duration-300 bg-white text-black',
        showSidebar ? 'translate-x-0 w-3/4' : '-translate-x-full',
        'md:translate-x-0 md:w-64'
      ]"
    >
      <div class="p-4 font-bold text-xl text-violet-400">BitByBit</div>
      <nav class="flex flex-col">
        <router-link
          v-for="link in links" 
          :key="link.name" 
          :to="link.path"
          class="p-2 text-black hover:bg-gray-300 hover:text-black"
          active-class="text-white bg-violet-400"
        >
          {{ link.name }}
        </router-link>
      </nav>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      showSidebar: false, // Controls the sidebar visibility on mobile
      links: [
        { name: "Home", path: "/" },
        { name: "Calendar", path: "/calendar" },
        { name: "Sunnahs", path: "/sunnahs" },
        { name: "Stats", path: "/stats" },
        { name: "Test", path: "/test" }
      ],
    };
  },
  props: {
    showSidebar: Boolean,
  },
  methods: {
    toggleSidebar() {
      this.$emit("toggle-sidebar");
    },
  },
};
</script>
