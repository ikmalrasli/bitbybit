import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
import router from './router'
import { createPinia } from 'pinia';
import ToastPlugin from './plugins/toast';
import * as Sentry from "@sentry/vue";

const pinia = createPinia();

const app = createApp(App)
    .use(router)
    .use(pinia)
    .use(ToastPlugin);

Sentry.init({
    app,
    dsn: "https://7729eb6dd72e3473fda857e62a594f00@o4508747920769024.ingest.us.sentry.io/4508747924176896",
    integrations: [
        Sentry.browserTracingIntegration({ router }),
        Sentry.replayIntegration(),
        Sentry.vueIntegration({
            app,
            tracingOptions: {
                trackComponents: true,
            },
        }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Error Handling
    logErrors: true,
    environment: process.env.NODE_ENV,
});

app.mount('#app');

// if ('serviceWorker' in navigator) {
//     navigator.serviceWorker
//         .register('firebase-messaging-sw.js')
//         .then((registration) => {
//         console.log('Service Worker registered successfully:', registration);
//         })
//         .catch((error) => {
//         console.error('Service Worker registration failed:', error);
//         });
//     }