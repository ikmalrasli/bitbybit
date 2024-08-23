<template>
<div class="p-4 w-full">
    <div class="w-full flex flex-col p-4 mb-8 text-gray-700 bg-white shadow-md bg-clip-border rounded-xl mx-auto">
        <span class="font-semibold text-lg p-2">This week</span>
        <div class="w-full flex flex-row">
            <div v-for="day in days" :key="day" class="w-full flex-auto">
                <div class="w-full grid justify-items-center">
                    <div class="bg-violet-400 h-2 rounded-full" :style="{ height: '100px', width: '20px' }"></div>
                    <span>{{day.name}}</span>
                </div>
            </div>
        </div>
    </div>

    <CalendarMonth/>
</div>
</template>

<script>
import CalendarMonth from "../../components/calendar-month.vue"
export default {
    components: {
        CalendarMonth
    },
    data() {
        return {
            days: [
                { name: 'Sun', date: 4, isActive: false, progress: 5},
                { name: 'Mon', date: 5, isActive: false, progress: 25},
                { name: 'Tue', date: 6, isActive: false, progress: 100},
                { name: 'Wed', date: 7, isActive: false, progress: 50},
                { name: 'Thu', date: 8, isActive: false, progress: 100},
                { name: 'Fri', date: 9, isActive: false, progress: 30},
                { name: 'Sat', date: 10, isActive: true, progress: 80},
            ]
        };
    },
}
</script>

<style>
.card {
  display: flex;

  background-color: #fff;
  border: 2px solid transparent; /* Added transparent border */
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease, border 0.3s ease;
  overflow: hidden;
  text-align: center;
}

span {
    color: black;
}
</style>