import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/p1/home-p1.vue'
import Calendar from '../views/p1/calendar-p1.vue'
import Sunnahs from '../views/p1/sunnah-p1.vue'
import Stats from '../views/p1/stats-p1.vue'
import Test from '../views/p1/test-p1.vue'


const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path:'/', component: Home},
        { path:'/calendar', component: Calendar, meta: {title: 'Calendar'}},
        { path:'/sunnahs', component: Sunnahs, meta: {title: 'Sunnahs'}},
        { path:'/stats', component: Stats, meta: {title: 'Stats'}},
        { path:'/test', component: Test, meta: {title: 'Test'}},
    ]

})

export default router