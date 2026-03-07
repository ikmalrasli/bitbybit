import { defineStore } from 'pinia';
import { memoService } from '../services/memoService';
import { useUserStore } from '../store/userStore';

export const useMemoStore = defineStore('memoStore', {
  state: () => ({
    dayMemos: {},
  }),
  actions: {
    async getMemos(start, end) {
      const userStore = useUserStore();
      const uid = userStore.getUserId;
      this.dayMemos = { ...this.dayMemos, ...await memoService.fetchMemos(uid, start, end) };
    },
  }
});