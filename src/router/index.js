import { createRouter, createWebHistory } from 'vue-router'
import store from '../store';  // Import the Vuex store
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
import AddSunnahs from '../views/add-sunnahs-admin.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        alias: 'home',
        name: 'home',
        component: Home,
        meta: { requiresAuth: true }
      },
      {
        path: 'add-habit',
        name: 'add-habit',
        components: {
          default: Home,
          right: AddHabit
        },
        meta: { requiresAuth: true }
      },
      {
        path: 'detail/:habitId:timestamp',
        name: 'detail-habit',
        components: {
          default: Home,
          right: DetailHabit
        },
        props: {
          right: (route) => ({ 
            habitId: route.params.habitId, 
            timestamp: route.params.timestamp})  // Pass habitData to the right view
        },
        meta: { requiresAuth: true }
      },
      {
        path: 'edit/:habitId',
        name: 'edit-habit',
        components: {
          default: Home,
          right: AddHabit
        },
        props: {
          right: (route) => ({ habitId: route.params.habitId })  // Pass habitData to the right view
        },
        meta: { requiresAuth: true }
      },
      {
        path: 'calendar',
        name: 'calendar',
        component: Calendar,
        meta: { title: 'Calendar', requiresAuth: true },
      },
      {
        path: 'sunnahs',
        name: 'sunnahs',
        component: Sunnahs,
        meta: { title: 'Sunnahs', requiresAuth: true },
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
        },
        meta: { requiresAuth: true }
      },
      {
        path: 'sunnahs/:sunnahId-add',
        name: 'add-sunnah',
        components: {
          default: Sunnahs,
          right: AddHabit
        },
        props: {
          right: (route) => ({ sunnahId: route.params.sunnahId })  // Pass habitData to the right view
        },
        meta: { requiresAuth: true }
      },
      {
        path: 'stats',
        name: 'stats',
        component: Stats,
        meta: { title: 'Stats', requiresAuth: true },
      },
      {
        path: '/test',
        component: Test,
        meta: { title: 'Test', requiresAuth: true },
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
  },
  {
    path: '/admin/add-sunnahs',
    name: 'add-sunnahs-admin',
    component: AddSunnahs,
    meta: { title: 'Add Sunnahs' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isAuthenticated = store.getters.isAuthenticated;

  // Handle refreshing the page returns to parent (due to no data in store)
  if (to.name === 'detail-habit' && !from.name) {
    next({ name: 'home' });
  } 
  else if (to.name === 'edit-habit' && !from.name) {
    next({ name: 'home' });
  } 
  else if (to.name === 'detail-sunnah' && !from.name) {
    next({ name: 'sunnahs' });
  } 
  else if (to.name === 'add-sunnah' && !from.name) {
    next({ name: 'sunnahs' });
  } 
  // Handle authentication check
  else if (requiresAuth && !isAuthenticated) {
    // If the route requires authentication and the user is not authenticated, redirect to login
    next({ name: 'login' });
  } 
  // Allow navigation if authenticated or if the route doesn't require authentication
  else {
    next();
  }
});

export default router;
