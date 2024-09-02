import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../views/main-layout.vue'
import Home from '../views/p1/home-p1.vue'
import Calendar from '../views/p1/calendar-p1.vue'
import Sunnahs from '../views/p1/sunnah-p1.vue'
import Stats from '../views/p1/stats-p1.vue'
import Test from '../views/p1/test-p1.vue'
import Test2 from '../views/p2/test-p2.vue'
import AddHabit from '../views/p2/add-habits-p2.vue'
import DetailHabit from '../views/p2/detail-habit-p2.vue'
import DetailSunnah from '../views/p2/detail-sunnah-p2.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: 'home',
        alias: '',
        name: 'home',
        component: Home
      },
      {
        path: 'add-habit',
        name: 'add-habit',
        components: {
          default: Home,
          right: AddHabit
        }
      },
      {
        path: 'detail/:habitId',
        name: 'detail-habits',
        components: {
          default: Home,
          right: DetailHabit
        },
        props: {
          right: (route) => ({ habitId: route.params.habitId })  // Pass habitData to the right view
        }
      },
      {
        path: '/calendar',
        component: Calendar,
        meta: { title: 'Calendar' },
      },
      {
        path: '/sunnahs',
        component: Sunnahs,
        meta: { title: 'Sunnahs' },
      },
      {
        path: 'sunnahs/:sunnahId',
        name: 'detail-sunnah',
        components: {
          default: Sunnahs,
          right: DetailSunnah
        },
        props: {
          right: (route) => ({ sunnahId: route.params.sunnahId })  // Pass habitData to the right view
        }
      },
      {
        path: '/stats',
        component: Stats,
        meta: { title: 'Stats' },
      },
      {
        path: '/test',
        component: Test,
        meta: { title: 'Test' },
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
