<template>
    <div class="w-full flex flex-row gap-1 mb-4">
      <div v-for="day in days" :key="day.date" class="flex-auto">
        <div :class="['rounded-lg border bg-white text-black', day.isToday ? 'border-violet-400 border-2' : 'border-slate-400']">
          <div class="flex flex-col items-center">
            <span class="min-w-8 text-xs sm:text-sm">{{ day.name }}</span>
            <RadialProgressbar
                :progress="day.progress"
                :size="24"
                :radius="40"
                :datenumber ="day.date"
                style="margin-top:12px;"
                color="text-violet-400"
              />
          </div>
      </div>
      </div>
    </div>
</template>

<script>
import RadialProgressbar from './RadialProgressbar.vue';
export default {
  components: {
        RadialProgressbar
    },
  data() {
    return {
      days: [
        { name: 'Sun', date: 4, isToday: false, progress: 5},
        { name: 'Mon', date: 5, isToday: false, progress: 25},
        { name: 'Tue', date: 6, isToday: false, progress: 100},
        { name: 'Wed', date: 7, isToday: false, progress: 50},
        { name: 'Thu', date: 8, isToday: false, progress: 100},
        { name: 'Fri', date: 9, isToday: false, progress: 30},
        { name: 'Sat', date: 10, isToday: true, progress: 80},
      ]
    };
  },
};
</script>

<style scoped>

</style>