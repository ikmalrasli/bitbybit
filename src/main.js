import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
import router from './router'
import store from './store';
import { createPinia } from 'pinia';
import ToastPlugin from './plugins/toast';

const pinia = createPinia();

createApp(App)
    .use(router)
    .use(store)
    .use(pinia)
    .use(ToastPlugin)
    .mount('#app')
