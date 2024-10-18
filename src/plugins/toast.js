// plugins/toast.js
import { useToastStore } from '../store/toastStore';

export default {
  install(app) {
    const toastStore = useToastStore();

    app.config.globalProperties.$toast = {
      show(message, options = {}) {
        toastStore.showToast({ message, ...options });
      },
      success({ message, duration }) {
        toastStore.showToast({ message, type: 'success', duration });
      },
      error({ message, duration }) {
        toastStore.showToast({ message, type: 'error', duration });
      },
      info({ message, duration }) {
        toastStore.showToast({ message, type: 'info', duration });
      },
      warning({ message, duration }) {
        toastStore.showToast({ message, type: 'warning', duration });
      },
      hide(id) {
        toastStore.hideToast(id);
      }
    };
  }
};
