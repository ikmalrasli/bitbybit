import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
import router from './router'
import store from './store';
import { createPinia } from 'pinia';
import ToastPlugin from './plugins/toast';
import * as Sentry from "@sentry/vue";
import { db } from './db';

/**
 * Step 1 verification: ensures Dexie schema is created and read/write works.
 * Remove or disable before production if desired.
 */
async function verifyDexie() {
  try {
    await db.open();
    const tableNames = db.tables.map((t) => t.name).join(', ');
    console.log('[Dexie] ✅ Connected. Tables:', tableNames);

    // Test write + read on settings
    await db.settings.put({ key: 'step1_test', value: Date.now() });
    const row = await db.settings.get('step1_test');
    if (row && row.value) {
      console.log('[Dexie] ✅ Settings read/write OK');
    } else {
      console.warn('[Dexie] ⚠ Settings read returned unexpected:', row);
    }

    // Expose db in dev for manual verification (e.g. in browser console: window.db.settings.toArray())
    if (import.meta.env.DEV) {
      window.__dexieDb = db;
      console.log('[Dexie] 💡 Dev: use window.__dexieDb to inspect (e.g. __dexieDb.settings.toArray())');
    }
  } catch (e) {
    console.error('[Dexie] ❌ Verification failed:', e);
  }
}
verifyDexie();

const pinia = createPinia();

const app = createApp(App)
    .use(router)
    .use(store)
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