export function getTotalProgressDay(day, weekProgress, habits) {
    const dayProgress = [];
    const dayStart = new Date(day);
    const dayEnd = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    dayEnd.setHours(23, 59, 59, 999);
  
    weekProgress.forEach(habit => {
      const habitTimestamp = habit.timestamp ? habit.timestamp.toDate() : null;
  
      if (habitTimestamp && habitTimestamp >= dayStart && habitTimestamp <= dayEnd) {
        dayProgress.push(habit);
      }
    });
  
    const combinedDayHabits = habits.map(habit => {
      const progressEntry = dayProgress.find(weekHabit => weekHabit.habitId === habit.habitId);
      return {
        ...habit,
        progress: progressEntry ? progressEntry.progress : 0,
        progressId: progressEntry ? progressEntry.progressId : '',
        timestamp: progressEntry ? progressEntry.timestamp : null,
      };
    });
  
    const startHabits = combinedDayHabits.filter(habit => habit.termStart.toDate() <= day);
    const endHabits = startHabits.filter(habit =>
      habit.termEnd === null || habit.termEnd.toDate() >= day
    ).sort((a, b) => a.name.localeCompare(b.name));
  
    let progress = 0;
    let totalDailyGoal = 0;
    const startDay = new Date(day).setHours(0, 0, 0, 0);
    const endDay = new Date(day).setHours(23, 59, 59, 999);
  
    endHabits.forEach(habit => {
      const habitDate = habit.timestamp ? habit.timestamp.toDate() : null;
      if (habitDate && habitDate <= endDay && habitDate >= startDay) {
        progress += Number(habit.progress);
      }
      totalDailyGoal += habit.dailyGoal || 0;
    });
  
    const totalProgress = totalDailyGoal > 0 ? (progress / totalDailyGoal) * 100 : 0;
    
    return { endHabits, totalProgress };
  }
  