<template>
  <div class="flex relative justify-center w-full h-dvh flex-col overflow-hidden">
    
    <div class="flex justify-center w-full flex-grow flex-row relative">
      <Toast />
      <!-- left column -->
      <Sidebar :show-sidebar="showSidebar" @toggle-sidebar="toggleSidebar" class="h-full" />

      <!-- center column -->
      <div v-if="!isTablet || !isDetailView"
        class="flex-1 flex flex-col h-full md:border-l md:border-r">
        <!--Title Bar-->
        <div>
          <TitleBar @toggle-sidebar="toggleSidebar" />
        </div>

        <!--Calendar Row-->
        <div v-if="showCalendarRow"
          class="flex-shrink-0 justify-start mb-2">
          <calendarRow @date-selected="handleDateSelected" />
        </div>

        <!--Center Router View-->
        <router-view class="h-96 overflow-y-auto scrollbar-hide" />
        
      </div>

      <!-- right column -->
      <div v-if="!isTablet || isDetailView" 
      class="flex-1 flex h-full"
      :class="[!isMobile && isTablet ? 'ml-56' : '']">
        <router-view class="h-full w-full" name="right" />
      </div>

      <!-- fab -->
      <fab v-if="$route.name === 'home'" />
    </div>

    
    <Dialog/>
    <addMemoDialog />
    <sortHabitsDialog />
    <viewMemoDialog />
    <!-- Mobile Bottom Navigation Bar -->
    <BottomNavBar v-if="isMobile" />
  </div>
</template>

<script>
import TitleBar from "../components/title-bar.vue";
import Sidebar from "../components/side-bar.vue";
import calendarRow from "../components/calendar-row.vue";
import Toast from "../components/toast-noti.vue";
import Dialog from "../components/confirm-dialog.vue";
import addMemoDialog from "../components/add-memo-dialog.vue";
import viewMemoDialog from "../components/view-memo-dialog.vue";
import sortHabitsDialog from "../components/sort-habits-dialog.vue";
import fab from "../components/fab.vue";
import BottomNavBar from "../components/bottom-nav-bar.vue";

export default {
  components: {
    BottomNavBar,
    calendarRow,
    TitleBar,
    Sidebar,
    Toast,
    Dialog,
    addMemoDialog,
    sortHabitsDialog,
    viewMemoDialog,
    fab
  },
  data() {
    return {
      showSidebar: false,
      isMobile: false,
      isTablet: false
    };
  },
  computed: {
    showCalendarRow(){
      return (
        this.$route.name === 'home' ||
        this.$route.name === 'add-habit' ||
        this.$route.name === 'edit-habit' ||
        this.$route.name === 'detail-habit' ||
        this.$route.name === 'add-memo'
      );
    },
    isDetailView() {
      return (
        this.$route.name === 'add-habit' ||
        this.$route.name === 'add-memo' ||
        this.$route.name === 'edit-habit' ||
        this.$route.name === 'detail-habit' ||
        this.$route.name === 'detail-sunnah' ||
        this.$route.name === 'add-sunnah' ||
        this.$route.name === 'detail-stats' ||
        this.$route.name === "account" ||
        this.$route.name === "about" ||
        this.$route.name === "news"
      );
    },
  },
  methods: {
    toggleSidebar() {
      this.showSidebar = !this.showSidebar;
    },
    checkMobile() {
      this.isMobile = window.innerWidth < 768;
      this.isTablet = window.innerWidth < 896;
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
