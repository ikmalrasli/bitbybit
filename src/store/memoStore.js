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
      console.log('Debug - memoStore.getMemos:', { uid, start, end });
      const memos = await memoService.fetchMemos(uid, start, end);
      console.log('Debug - fetched memos:', memos);
      this.dayMemos = { ...this.dayMemos, ...memos };
      console.log('Debug - updated dayMemos:', this.dayMemos);
    },
  }
});