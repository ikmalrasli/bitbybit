import { Timestamp } from "firebase/firestore";

function getDayOfWeek(date) {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[new Date(date).getDay()];  // getDay() returns 0 for Sunday, 6 for Saturday
}

export function getTotalProgressDay(day, weekProgress, habits, pauses) {
  const dayProgress = [];
  const dayStart = new Date(day);
  const dayEnd = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  dayEnd.setHours(23, 59, 59, 999);

  weekProgress.forEach(habit => {
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
  });

  

  let progress = 0;
  let totalDailyGoal = 0;
  // Filter out paused habits first
  const notPausedHabits = endHabits.filter(habit => !isHabitPausedOnDay(habit.habitId, day, pauses));
  console.log('Not paused habits for day', day, ':', notPausedHabits);

  notPausedHabits.forEach(habit => {
    const habitDate = habit.timestamp ? new Timestamp(habit.timestamp.seconds, habit.timestamp.nanoseconds).toDate() : null;
    if (habitDate && habitDate <= endDay && habitDate >= startDay) {
      progress += Number(habit.progress);
    }
    console.log('Adding daily goal for habit:', habit.habitId, 'with daily goal:', habit.dailyGoal);
    totalDailyGoal += habit.dailyGoal || 0;
  });
  // const totalProgress = totalDailyGoal > 0 ? (progress / totalDailyGoal) * 100 : 0;
  
  // endHabits.forEach(habit => {
  //   const habitDate = habit.timestamp ? new Timestamp(habit.timestamp.seconds, habit.timestamp.nanoseconds).toDate() : null;
  //   if (habitDate && habitDate <= endDay && habitDate >= startDay) {
  //     progress += Number(habit.progress);
  //   }
  //   // totalDailyGoal += habit.dailyGoal || 0;
  //   const notPausedHabits = endHabits.filter(habit => !isHabitPausedOnDay(habit.habitId, day, pauses));
  //   for (const habit of notPausedHabits) {
  //     totalDailyGoal += habit.dailyGoal || 0;
  //   }
  // });

  const totalProgress = totalDailyGoal > 0 ? (progress / totalDailyGoal) * 100 : 0;

  return { endHabits, totalProgress };
}

function isHabitPausedOnDay(habitId, day, pauses) {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);

  return pauses?.some(pause => {
    if (pause.habitId !== habitId) return false;
    const start = pause.start.toDate ? pause.start.toDate() : new Date(pause.start.seconds * 1000);
    const end = pause.end
      ? (pause.end.toDate ? pause.end.toDate() : new Date(pause.end.seconds * 1000))
      : null;
    if (end) {
      return dayStart <= end && dayEnd >= start;
    } else {
      console.log('Checking ongoing pause for habit:', habitId, 'on day:', dayStart, 'with pause start:', start);
      return dayStart >= start;
    }
  });
}
