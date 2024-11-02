<template>
  <div class="flex relative justify-center w-full h-dvh">
    <Sidebar :show-sidebar="showSidebar" @toggle-sidebar="toggleSidebar"
      :class="!isMobile ? 'h-auto' : ''" />

    <div v-if="!isMobile || !isDetailView" :class="contentClass"
      class="flex-1 flex flex-col h-full border-l border-r">

      <!--Title Bar-->
      <div>
        <TitleBar @toggle-sidebar="toggleSidebar" />
      </div>

      <!--Calendar Row-->
      <div v-if="showCalendarRow"
        class="flex-shrink-0 justify-start h-auto mb-2"> <!-- Set flexible height -->
        <calendarRow @date-selected="handleDateSelected" />
      </div>

      <!--Main Router View-->
      <div class="flex-grow overflow-y-auto scrollbar-hide">
        <router-view />
      </div>
    </div>

    <!--Right Router View-->
    <div v-if="!isMobile || isDetailView" class="flex-1 h-full">
      <router-view class="w-full" name="right" />
    </div>

    <Toast />
  </div>
</template>

<script>
import TitleBar from "../components/title-bar.vue";
import Sidebar from "../components/nav-bar.vue";
import calendarRow from "../components/calendar-row.vue";
import Toast from "../components/toast-noti.vue";

export default {
  components: {
    calendarRow,
    TitleBar,
    Sidebar,
    Toast
  },
  data() {
    return {
      showSidebar: false,
      isMobile: false,
    };
  },
  computed: {
    showCalendarRow(){
      return (
        this.$route.name === 'home' ||
        this.$route.name === 'add-habit' ||
        this.$route.name === 'edit-habit' ||
        this.$route.name === 'detail-habit'
      );
    },
    isDetailView() {
      return (
        this.$route.name === 'add-habit' ||
        this.$route.name === 'edit-habit' ||
        this.$route.name === 'detail-habit' ||
        this.$route.name === 'detail-sunnah' ||
        this.$route.name === 'add-sunnah' ||
        this.$route.name === 'detail-stats'
      );
    },
    contentClass() {
      return this.isMobile ? "px-1" : "ml-56"; // On desktop, add margin for the sidebar
    },
  },
  methods: {
    toggleSidebar() {
      this.showSidebar = !this.showSidebar;
    },
    checkMobile() {
      this.isMobile = window.innerWidth < 768;
    },
    handleDateSelected(date) {
      // Define the logic for what should happen when a date is selected.
      console.log("Date selected:", date);
      // You can dispatch actions, navigate, or any other necessary logic
    }
  },
  mounted() {
    this.checkMobile();
    window.addEventListener("resize", this.checkMobile);

    this.$router.beforeEach((to, from, next) => {
      // Close sidebar on mobile when route changes
      if (this.showSidebar && this.isMobile) {
        this.showSidebar = false;
      }
      next();
    });
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.checkMobile);
  },
};
</script>
