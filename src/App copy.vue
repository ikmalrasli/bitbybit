<template>
  <div class="flex">
    <!-- Sidebar -->
    <Sidebar />
    <!-- Main Content -->
    <div class="flex-grow p-4 ml-64" v-if="!isMobile">
      <!-- On desktop, add margin to account for the sidebar width -->
      <router-view />
    </div>

    <div class="flex-grow p-4" v-if="isMobile">
      <!-- On mobile, no margin is needed -->
      <router-view />
    </div>
  </div>
</template>

<script>
import Sidebar from './components/nav-bar.vue';

export default {
  components: {
    Sidebar,
  },
  data() {
    return {
      isMobile: false,
    };
  },
  methods: {
    checkMobile() {
      this.isMobile = window.innerWidth < 768;
    },
  },
  mounted() {
    this.checkMobile();
    window.addEventListener('resize', this.checkMobile);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.checkMobile);
  },
};
</script>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background: white;
}
</style>
