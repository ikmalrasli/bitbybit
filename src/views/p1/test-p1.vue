<template>
  <div class="p-4 w-full">
    <h1>User: {{ username }}</h1>
    <RadialProgressbar
            :progress="30"
            :radius="40"
            :datenumber="5"
            :datecolor="hello ? '#000000' : '#FF5733'"
            style="margin-top:12px;"
            color="text-violet-400"
          />
  </div>
</template>

<script>
import VerticalProgressbar from '../../components/VerticalProgressbar.vue';
import HomeProgress from '../../components/home-progressbar.vue';
import RadialProgressbar from '../../components/RadialProgressbar.vue';

export default {
  components: {
    VerticalProgressbar,
    HomeProgress,
    RadialProgressbar
  },
  data() {
    return {
      username: this.$store.state.user.displayName,
      hello : false
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