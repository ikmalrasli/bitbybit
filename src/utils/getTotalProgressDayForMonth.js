import { Timestamp } from "firebase/firestore";

function getDayOfWeek(date) {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[new Date(date).getDay()];  // getDay() returns 0 for Sunday, 6 for Saturday
}

// utils/getTotalProgressDayForMonth.js
export function getTotalProgressDayForMonth(day, progressArray, habits) {
  const dayProgress = [];
  const dayStart = new Date(day).setHours(0, 0, 0, 0);
  const dayEnd = new Date(day).setHours(23, 59, 59, 999);

  progressArray.forEach(habit => {
    const habitTimestamp = habit.timestamp ? new Timestamp(habit.timestamp.seconds, habit.timestamp.nanoseconds).toDate() : null;

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

  const startDay = new Date(day).setHours(0, 0, 0, 0);
  const endDay = new Date(day).setHours(23, 59, 59, 999);

  const dayOfWeek = getDayOfWeek(day);
  const filteredHabits = combinedDayHabits.filter(habit => habit.repeat && habit.repeat[dayOfWeek]);
  const startHabits = filteredHabits.filter(habit => {
    const termStart = new Timestamp(habit.termStart.seconds, habit.termStart.nanoseconds).toDate().setHours(0, 0, 0, 0);
    return termStart <= endDay;
  });
  const endHabits = startHabits.filter(habit => {
    if (habit.termEnd !== null) {
      const termEnd = new Timestamp(habit.termEnd.seconds, habit.termEnd.nanoseconds).toDate().setHours(23, 59, 59, 999);
      return termEnd >= endDay
    }
    return habit.termEnd === null
  }).sort((a, b) => a.name.localeCompare(b.name));
  
  let progress = 0;
  let totalDailyGoal = 0;
  
  endHabits.forEach(habit => {
    const habitDate = habit.timestamp ? new Timestamp(habit.timestamp.seconds, habit.timestamp.nanoseconds).toDate() : null;
    if (habitDate && habitDate <= endDay && habitDate >= startDay) {
      progress += Number(habit.progress);
    }
    totalDailyGoal += habit.dailyGoal;
  });

  const totalProgress = totalDailyGoal > 0 ? (progress / totalDailyGoal) * 100 : 0;
  
  return { totalProgress, endHabits };
}