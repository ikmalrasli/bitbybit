<template>
  <div class="p-4 w-full">
    <h1>User: {{ username }}</h1>
  </div>
</template>

<script>
import VerticalProgressbar from '../../components/VerticalProgressbar.vue';
import HomeProgress from '../../components/home-progressbar.vue';
import RadialProgressBar from '../../components/RadialProgressbar.vue';

export default {
  components: {
    VerticalProgressbar,
    HomeProgress,
    RadialProgressBar
  },
  data() {
    return {
      username: this.$store.state.user.displayName,
    }
  },
  methods: {
    checkUser() {
      this.$store.state.weekHabits.forEach(element => {
        console.log(element)
      })
    },
  },
}
</script>

<style>

</style>