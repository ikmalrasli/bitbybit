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
import Login from '../views/auth/login-page.vue'
import Register from '../views/auth/register-page.vue'
import ForgotPassword from '../views/auth/forgot-page.vue'

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
        path: 'detail/:habitId:timestamp',
        name: 'detail-habit',
        components: {
          default: Home,
          right: DetailHabit
        },
        props: {
          right: (route) => ({ habitId: route.params.habitId, timestamp: route.params.timestamp })  // Pass habitData to the right view
        }
      },
      {
        path: 'calendar',
        name: 'calendar',
        component: Calendar,
        meta: { title: 'Calendar' },
      },
      {
        path: 'sunnahs',
        name: 'sunnahs',
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
        path: 'stats',
        name: 'stats',
        component: Stats,
        meta: { title: 'Stats' },
      },
      {
        path: '/test',
        component: Test,
        meta: { title: 'Test' },
      }
    ]
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: { title: 'Login' }
  },
  {
    path: '/register',
    name: 'register',
    component: Register,
    meta: { title: 'Register' }
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: ForgotPassword,
    meta: { title: 'Forgot Password' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
