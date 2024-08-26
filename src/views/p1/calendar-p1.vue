<template>
<div class="p-4 w-full flex flex-col flex-grow">
    <div class="w-full flex flex-col p-4 mb-8 text-gray-700 bg-white shadow-md bg-clip-border rounded-xl">
        <span class="font-semibold text-lg p-2 text-center mb-2">This week</span>
        <div class="w-full flex flex-row gap-1">
            <div v-for="day in days" :key="day" class="w-full">
                <div class="w-full grid justify-items-center">
                    <div class="bg-violet-400 h-2 rounded-full" :style="{ height: '100px', width: '20px' }"></div>
                    <span class="mt-2">{{day.name}}</span>
                </div>
            </div>
        </div>
    </div>
    
    <CalendarMonth class="flex-grow w-full" />
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
