import { db } from '../db';

export const memoService = {
  async fetchMemos(userId, startDate, endDate) {
    // 1. Fetch all memos for the user
    const memos = await db.memos.where('userId').equals(userId).toArray();

    // 2. Build the Day-by-Day View with memos mapped to date keys
    const memosMap = {};
    
    // Initialize date range with empty arrays
    let current = new Date(startDate);
    while (current <= endDate) {
      const dateKey = current.toISOString().split('T')[0];
      memosMap[dateKey] = [];
      current.setDate(current.getDate() + 1);
    }

    // 3. Map memos to their corresponding date keys
    memos.forEach(memo => {
      const memoDate = new Date(memo.timestamp);
      const dateKey = memoDate.toISOString().split('T')[0];
      
      // Only include memos within the specified date range
      if (memoDate >= startDate && memoDate <= endDate && memosMap[dateKey]) {
        memosMap[dateKey].push({
          id: memo.id,
          category: memo.category,
          memo: memo.memo,
          timestamp: memo.timestamp,
          syncStatus: memo.syncStatus
        });
      }
    });

    return memosMap;
  }
};