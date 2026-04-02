import { db } from '../db';
import { generateId } from '../utils/generateId';
import { useUserStore } from '../store/userStore';

export const memoService = {
  async addMemo(memoData) {
    const memoId = memoData.id || generateId();
    const now = new Date();

    await db.memos.add({
      id: memoId,
      ...memoData,
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    });

    // Refetch memos to update UI
    const userStore = useUserStore();
    const userId = userStore.getUserId;
    const today = new Date();
    const startOfLastWeek = new Date(today);
    startOfLastWeek.setDate(today.getDate() - today.getDay() - 14);
    startOfLastWeek.setHours(0, 0, 0, 0);
    
    // This will trigger memoStore.getMemos() to refresh the data
    return { memoId, refetchData: { userId, start: startOfLastWeek, end: today } };
  },

  async deleteMemo(memoId) {
    await db.memos.delete(memoId);
    
    // Refetch memos to update UI
    const userStore = useUserStore();
    const userId = userStore.getUserId;
    const today = new Date();
    const startOfLastWeek = new Date(today);
    startOfLastWeek.setDate(today.getDate() - today.getDay() - 14);
    startOfLastWeek.setHours(0, 0, 0, 0);
    
    // This will trigger memoStore.getMemos() to refresh the data
    return { refetchData: { userId, start: startOfLastWeek, end: today } };
  },

  async fetchMemos(userId, startDate, endDate) {
    console.log('Debug - memoService.fetchMemos:', { userId, startDate, endDate });
    
    // 1. Fetch all memos for the user
    const memos = await db.memos.where('userId').equals(userId).toArray();
    console.log('Debug - raw memos from DB:', memos);

    // 2. Build the Day-by-Day View with memos mapped to date keys
    const memosMap = {};
    
    // Initialize date range with empty arrays
    // Normalize endDate to end of day to include the full end date
    let current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    
    const normalizedEndDate = new Date(endDate);
    // Below line is to include today's memos
    normalizedEndDate.setDate(normalizedEndDate.getDate() + 1); // I don't know a proper fix for this yet but this will do
    normalizedEndDate.setHours(23, 59, 59, 999);
    
    console.log('Debug - date range:', { 
      start: current.toISOString().split('T')[0], 
      end: normalizedEndDate.toISOString().split('T')[0] 
    });
    
    while (current <= normalizedEndDate) {
      const dateKey = current.toISOString().split('T')[0];
      memosMap[dateKey] = [];
      current.setDate(current.getDate() + 1);
    }

    // 3. Map memos to their corresponding date keys
    memos.forEach(memo => {
      const memoDate = new Date(memo.timestamp);
      const dateKey = memoDate.toISOString().split('T')[0];
      
      console.log('Debug - processing memo:', { memo, dateKey });
      
      // Only include memos within the specified date range
      if (memoDate >= startDate && memoDate <= normalizedEndDate && memosMap[dateKey]) {
        memosMap[dateKey].push({
          id: memo.id,
          category: memo.category,
          memo: memo.memo,
          timestamp: memo.timestamp,
          syncStatus: memo.syncStatus
        });
      }
    });

    console.log('Debug - final memosMap:', memosMap);
    return memosMap;
  }
};