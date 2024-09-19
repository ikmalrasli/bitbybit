<template>
  <div class="p-4 border w-full">
    <button class="bg-blue-500 rounded-lg p-4 text-white" @click="checkUser">check habits</button>
    <div class="mb-4 py-4 transition-all duration-300 ease-in-out">
      <div v-for="(habit, index) in habits" :key="index" class="mb-2">
        <HomeProgress
          :percent="1 * 100 / habit.dailyGoal"
          :text="habit.name"
          color="bg-violet-400"
          class="cursor-pointer"
        />
      </div>
    </div>
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